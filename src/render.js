// Buttons
const videoElement = document.querySelector('video')
const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')
const videoSelectBtn = document.getElementById('videoSelectBtn')

videoSelectBtn.onclick = getVideoSources

const electron = require('electron')
const { desktopCapturer } = require('electron')
const { Menu, dialog } = require('@electron/remote')

// Get the available video sources
async function getVideoSources() {
	const inputSources = await desktopCapturer.getSources({
		types: ['window', 'screen'],
	})

	const videoOptionsMenu = Menu.buildFromTemplate(
		inputSources.map(source => {
			return {
				label: source.name,
				click: () => selectSource(source),
			}
		})
	)

	videoOptionsMenu.popup()
}

// MediaRecorder instance to capture footage
let mediaRecorder
const recordedChunks = []

// Change the videoSource window to record
async function selectSource(source) {
	videoSelectBtn.innerText = source.name

	const constraints = {
		audio: false,
		video: {
			mandatory: {
				chromeMediaSource: 'desktop',
				chromeMediaSourceId: source.id,
			},
		},
	}

	// Create a Stream
	const stream = await navigator.mediaDevices.getUserMedia(constraints)

	// Preview the source in a video element
	videoElement.srcObject = stream
	videoElement.play()

	// Create the Media Recorder
	const options = { mimeType: 'video/webm; codecs=vp9' }
	mediaRecorder = new MediaRecorder(stream, options)

	// Register Event Handlers
	mediaRecorder.ondataavailable = handleDataAvailable
	mediaRecorder.onstart = handleDataAvailable
	mediaRecorder.onstop = handleStop

	startBtn.addEventListener('click', () => {
		mediaRecorder.start()
	})
	
	stopBtn.addEventListener('click', () => {
		mediaRecorder.stop()
	})
}

// Captures all recorded chunks
function handleDataAvailable(e) {
	console.log('mediaRecorder: ', mediaRecorder);
	console.log('video data available')
	recordedChunks.push(e.data)
}

const { writeFile } = require('fs')

// Saves the video file on stop
async function handleStop(e) {
	const blob = new Blob(recordedChunks, {
		type: 'video/webm; codecs=vp9',
	})

	const buffer = Buffer.from(await blob.arrayBuffer())

	const { filePath } = await dialog.showSaveDialog({
		buttonLabel: 'Save video',
		defaultPath: `vid-${Date.now()}.webm`,
	})

	writeFile(filePath, buffer, () => console.log('Video saved successfully!'))
}
