import requestScreen from './requestScreen';

/**
 * @param {{ screen: boolean } & MediaStreamConstraints} args
 * @return {Promise<MediaStream>}
*/
export default function getMediaStream({ screen, video, audio } = {}) {
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
