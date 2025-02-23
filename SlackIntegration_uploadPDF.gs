/**
 * @author NicolasLobos
 * 
 * @function SlackIntegration() retrieves a Google Document, inside a Google Drive Folder
 * turns it into a PDF file, and sends it over to a Slack channel
 * 
 * @var DOC_ID - The ID found on the URL for your Google Doc
 * @var FOLDER_ID - The ID found on the URL of your Google Drive Folder
 * @var headers_Authorization - Is the Slack Token from your user or bot, inside OAuth, in your Slack App setting
 */
function SlackIntegration() {
	// Retrieves the Template file
	const temp = DriveApp.getFileById(DOC_ID);
	// Retrieves the destination folder
	const folder = DriveApp.getFolderById(FOLDER_ID);
	// Makes a copy of the template file to the folder
	const file = temp.makeCopy(folder);
	// Opens the copy
	const doc = DocumentApp.openById(file.getId());

	/**
	 * Include here any changes you would like to make to the Google Document
	 */

	// Sets the Gdoc name as you wish
	docName = currentDate.toDateString();
	doc.setName(docName);

	// Creates a PDF and closes the doc
	const blob = doc.getAs(MimeType.PDF);
	doc.saveAndClose();
	// Creates the PDF in the destination folder
	const pdf = folder.createFile(blob).setName(docName + ".pdf");

	// Gathers name, and size
	var pdfname = docName + ".pdf";
	var pdf_size = pdf.getSize();
	console.log(pdf_size, pdfname);

	// Creates the URL that will be fetched, using pdf name + size as parameters
	var url =
		"https://slack.com/api/files.getUploadURLExternal?filename=" +
		pdfname +
		"&length=" +
		pdf_size +
		"&pretty=1";
	console.log(url);

	// Creates header for the request, uses token from Slack, content-type is urlencoded, method is post
	var headers = {
		Authorization:
		// Include here your own app or user token retrieved from Slack
			"Bearer xoxb-xxxxxxxxxxxxx-yyyyyyyyyyyyy-xyxyxyxyxyxyxyxyxyxyxyxy",
		"Content-Type": "application/x-www-form-urlencoded",
	};
	var options = {
		headers: headers,
		method: "POST",
	};

	// Fetches the url above, and retains its response
	var res = UrlFetchApp.fetch(url, options).getContentText();
	console.log(res);
	var response = JSON.parse(res);

	// From the response, extracts the URL to be used + file id
	var upload_url = response.upload_url;
	var upload_id = response.file_id;

	// Makes a new payload with the file name and a pdf blob
	var payload = {
		filename: pdfname,
		file: blob,
	};
	// Switches the content-type to match the file to be sent
	var header = {
		"Content-Type": "application/pdf",
	};
	// New parameters to be used with the URL received in the first response
	var params = {
		header: header,
		method: "POST",
		payload: payload,
	};

	// Fetches the url provided in the response and retains its response, usually just an Ok with file size
	var finalResponse = UrlFetchApp.fetch(upload_url, params);
	console.log(finalResponse.getContentText());

	// Sets the variables to be passed as parameters in the final URL [%0A - new line]
	var initial_msg =
		// add here the message that will be send into Slack
		"Hi team!";

	// Already encoded file id as the beginning and the end are always the same, and for some reason the URLfetchapp wasn't encoding this part by itself
	var json_file_id = "%5B%7B%22id%22%3A%22" + upload_id + "%22%7D%5D";
	// Fetch this channel id on your slack channel details, at the bottom
	var channel_id = "";
	// Creates the new URL
	var uploadFinish_url =
		"https://slack.com/api/files.completeUploadExternal?files=" +
		json_file_id +
		"&channel_id=" +
		channel_id +
		"&initial_comment=" +
		initial_msg +
		"&pretty=1";

	// Fetches the final url above, and retains the resposne
	var uploadfinish_res = UrlFetchApp.fetch(
		uploadFinish_url,
		options
	).getContentText();
	console.log(uploadfinish_res);
	// Sets the G-doc created to the trash, storing only the PDF
	file.setTrashed(true);
}