const fs = require("fs");
const path = require("path");

const date = new Date();
const timestamp = date
	.toISOString()
	.replace(/:/g, "-")
	.replace(/\..+/, "");

writeToFile = (fileName, lines) => {
	if (!fs.existsSync(path.join(__dirname, "results/"))) {
		fs.mkdirSync(path.join(__dirname, "results/"));
	}
	const fileStream = fs.createWriteStream(path.join(__dirname, "results/", `${fileName}-${timestamp}.md`), "utf8");

	fileStream.on("error", function(err) {
		console.log("ERROR writing to file");
	});

	fileStream.on("finish", () => {
		console.log("Writing to file complete");
	});

	const output = lines
		.map(line => {
			return line.join(" ");
		})
		.join("\n");
	fileStream.write(output, "utf8");

	fileStream.end();
};

mapSpeakerToText = (transcriptWordsAndTimestamps, speakers) => {
	let speakerId = 0;
	var lines = [],
		line;
	for (let i = 0; i < speakers.length; i++) {
		if (i === 0 || speakerId !== speakers[i].speaker) {
			if (i !== 0) {
				lines.push(line);
			}
			line = [];
			line.push("speaker " + speakers[i].speaker);
			speakerId = speakers[i].speaker;
		}
		line.push(transcriptWordsAndTimestamps[i][0]);
	}
	lines.push(line); // last line
	return lines;
};

const files = fs.readdirSync(path.join(__dirname, "/speechtotext"));
files.forEach(fileName => {
	let rawData = fs.readFileSync(path.join(__dirname, "/speechtotext/") + fileName, "utf8");
	let message = JSON.parse(rawData);

	// get all of the timestamps from multiple alternatives
	const messageTimestamps = message.results
		.map(result => {
			return result.alternatives.reduce((a, b) => a.concat(b.timestamps), []);
		})
		.reduce((acc, cur) => acc.concat(cur), []);

	if (message.speaker_labels) {
		var speakerTranscript = mapSpeakerToText(messageTimestamps, message.speaker_labels);
		writeToFile(fileName, speakerTranscript);
	}
});
