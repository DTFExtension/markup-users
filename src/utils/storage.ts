export interface badge {
    text?: string
    type?: string
}

interface storageArg {
    [id: number]: badge
}


export const saveToStorage = (data: storageArg) => {
    return new Promise(resolve =>  chrome.storage.sync.set(data, resolve))
}

export const getFromStorage = query => {
    return new Promise<storageArg>(resolve => chrome.storage.sync.get(query, resolve))
}

export const getAllFromStorage = () => {
    return new Promise<storageArg>(resolve => chrome.storage.sync.get(null, resolve))
}

export const removeFromStorage = query => {
    return new Promise(resolve => chrome.storage.sync.remove(query, resolve))
}