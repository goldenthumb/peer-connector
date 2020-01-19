import requestScreen from './requestScreen';

export default function getMediaStream({ screen = false, video = true, audio = true }) {
    return screen ?
        getDisplayMedia() :
        navigator.mediaDevices.getUserMedia({ video, audio });
}

function getDisplayMedia() {
    if (navigator.getDisplayMedia) {
        return navigator.getDisplayMedia({ video: true });
    }

    if (navigator.mediaDevices.getDisplayMedia) {
        return navigator.mediaDevices.getDisplayMedia({ video: true });
    }

    return navigator.mediaDevices.getUserMedia({ video: requestScreen() });
}
