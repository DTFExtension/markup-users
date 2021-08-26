import "/src/styles/internal.css";
import "/src/styles/content.css";
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import {getAllFromStorage} from "../utils/storage"
import EditBadgeModal from "../components/EditBadgeModal";

chrome.runtime.sendMessage({}, (response) => {
    const checkReady = setInterval(() => {
        if (document.readyState === "complete") {
            clearInterval(checkReady)
            init()
        }
    })
})

let badges = {}

const init = async () => {
    let timer = null;

    badges = await getAllFromStorage();

    // Observe
    const pageWrapper = document.querySelector('#page_wrapper');
    const observerConfig = {subtree: true, childList: true};

    const callback = (list: MutationRecord[], observer) => {
        list.filter(({type}) => type === 'childList')
            .forEach(({target}) => {

                // Content of the page is changed
                // Or hack if it was ajax request
                if (pageWrapper === target || (target as HTMLElement).classList.contains("l-page__header")) {
                    clearTimeout(timer)
                    timer = setTimeout(() => updatePage(pageWrapper), 50)
                }
            })
    }

    const observer = new MutationObserver(callback);
    observer.observe(pageWrapper, observerConfig);

    updatePage(pageWrapper)

}

const updatePage = target => {

    // If have /u/ in url, it profile page
    if (window.location.pathname.match(/\/u\/([\d]+)/)) {
        updateProfile(target);
    } else {
        updateArticle(target)
    }
}

const addEditBadgeModal = (id, target) => {
    const modalContainer = document.querySelector(".layout__content");

    // If modal wasn't added yet by any other occasion
    if (!modalContainer.querySelector(".v-popup-fp-container")) {
        const modalWrapper = document.createElement("div")
        modalWrapper.classList.add("v-popup-fp-container")
        document.querySelector(".layout__content")
            .appendChild(modalWrapper)
    }

    const modalWrapper = modalContainer.querySelector(".v-popup-fp-container")
    const afterSave = async () => {
        badges = await getAllFromStorage()
        await updateProfile(target)
    }

    // Render react component with callback and user's id as props
    ReactDOM.render(React.createElement(EditBadgeModal, {id, afterSave}), modalWrapper);
}

const updateArticle = (target) => {
    const commentsElement = target.querySelector(".comments")
    if (!commentsElement) return;

    commentsElement
        .querySelectorAll(".comments__item__self:not(.comments__item__self--removed)")
        .forEach(updateComment)
}

const updateProfile = async (target) => {

    const container = target.querySelector(".v-header-title__main");
    if (!container) return;

    // Remove previously added badge
    if (container.querySelector(".profile__badge")) {
        container.querySelector(".profile__badge").remove();
    }

    // Not profile page
    const [, id] = window.location.pathname.match(/\/u\/([\d]+)/) as [string, number]
    if (!id) return;

    // Get data from storage
    const {text = "нейтрально", type = "blue"} = badges[id] || {};

    // Build mark up
    const button = document.createElement("div")
    button.classList.add("v-header-title__item", "profile__badge")
    button.setAttribute("title", "Нажмите для редактирования")
    button.classList.toggle("profile__badge-red", type === 'red')
    button.addEventListener('click', () => addEditBadgeModal(id, target))
    button.innerHTML = text
    container.appendChild(button)

}

const updateComment = async (comment) => {

    try {
        // Get user's id from comment
        const urlMatch = comment
            .querySelector('.comments__item__user')
            .getAttribute('href')
            .match(/\/u\/([\d]+)/)

        if (!urlMatch) return;
        const [, id] = urlMatch;
        if (!id) return;

        // Get data from storage
        if (!badges[id]) return;

        const {text = "нейтрален", type = "blue"} = badges[id];

        // Build mark up
        const badgeElement = document.createElement("div");
        badgeElement.innerHTML = text
        badgeElement.classList.toggle("comments__item__badge-red", type === 'red')
        badgeElement.classList.add("comments__item__badge")

        comment
            .querySelector('.comments__item__users')
            .appendChild(badgeElement)

    } catch (e) {
        console.log(comment, e)
    }

}