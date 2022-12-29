document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archived'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', sendEmailHandler);
  document.querySelector('#archive').addEventListener('click', archiveHandler);
  document.querySelector('#unarchive').addEventListener('click', unarchiveHandler);
  document.querySelector('#reply').addEventListener('click', replyHandler);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#compose-alert').textContent = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#compose-alert').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';

  // Clear out the mail list first
  document.querySelector('#emails-list').innerHTML = "";

  // Show the mailbox name
  document.querySelector("#mailbox-name").innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;
  // Call an asynchronous function to fetch the mailbox from the server
  get_mailbox(mailbox);
}

async function get_mailbox(mailbox) {

  try {
    const response = await fetch(`/emails/${mailbox}`);
    if (!response.ok) {
      const result = await response.json();
      throw new Error(`HTTP error: ${response.status}`);
    }
    const result = await response.json();

    // Create list item to add to the unordered list, emails-list, in inbox.html
    for (const email of result) {
      createEmailItem(email);

      // Change the email's background color to gray if it was read
      if (email["read"]) {
        document.querySelector(`#emails-list > [id="${email["id"]}"]`).style.backgroundColor = "whitesmoke";
      }
    }

    // Add event listeners to each Email
    var anchors = document.querySelectorAll('a');
    for (var i = 0; i < anchors.length; i++) {
      anchors[i].addEventListener('click', viewEmailHandler);
    }

    // Saving the current mailbox to be able to retrieve later for archive/unarchive
    localStorage.setItem("currentMailbox", mailbox);

  }
  catch (error) {
    console.error(`Could not retrieve mailbox: ${error}`);
  }

}

function viewEmailHandler() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'block';
  document.querySelector("#archive").style.display = "none";
  document.querySelector("#unarchive").style.display = "none";


  // Call an asynchronous function to retrieve email details from the server
  viewEmail(this.id);
}

async function viewEmail(emailId) {
  try {
    const responses = await Promise.all([fetch(`/emails/${emailId}`), fetch(`/emails/${emailId}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })]);
    if (!responses[0].ok) {
      throw new Error(`HTTP error: ${responses[0].status}`);
    }
    if (!responses[1].ok) {
      throw new Error(`HTTP error: ${responses[1].status}`);
    }
    const result = await responses[0].json();

    // Fill email details in HTML
    document.querySelector("#email-detail > #emailId").innerHTML = result["id"];
    document.querySelector("#email-detail > #subject").innerHTML = result["subject"];
    document.querySelector("#email-detail > #sender").innerHTML = `<strong>From:</strong> ${result["sender"]}`;
    document.querySelector("#email-detail > #recipients").innerHTML = `<strong>To:</strong> ${result["recipients"]}`;
    document.querySelector("#email-detail > #body").innerHTML = result["body"];
    document.querySelector("#email-detail > #timestamp").innerHTML = result["timestamp"];

    // Saving the current email to be able to retrieve later for replying
    localStorage.setItem("currentEmail", JSON.stringify(result));

    // Showing and hiding archive and unarchive buttons depending on the current mailbox
    currentMailbox = localStorage.getItem("currentMailbox");
    if (currentMailbox !== "sent") {
      if (result["archived"]) {
        document.querySelector("#archive").style.display = "none";
        unarchiveButton = document.querySelector("#unarchive");
        unarchiveButton.style.display = "block";
      }
      else {
        document.querySelector("#unarchive").style.display = "none";
        archiveButton = document.querySelector("#archive");
        archiveButton.style.display = "block";
      }

    }

  }
  catch (error) {
    console.error(`Could not retrieve email: ${error}`);
  }

}

function archiveHandler() {
  // Call asynchronous function to send PUT request to the server
  archive();
}

function unarchiveHandler() {
  // Call asynchronous function to send PUT request to the server
  unarchive();
}

async function archive() {
  try {
    emailId = document.querySelector("#emailId").innerHTML;
    const response = await fetch(`/emails/${emailId}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    })
    load_mailbox('inbox');
  }
  catch (error) {
    console.error(`Could not archive email: ${error}`);
  }
}

async function unarchive() {
  try {
    emailId = document.querySelector("#emailId").innerHTML;
    const response = await fetch(`/emails/${emailId}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    })
    load_mailbox('inbox');
  }
  catch (error) {
    console.error(`Could not unarchive email: ${error}`);
  }
}

function createEmailItem(email) {

  // Create list item to add to the unordered list, emails-list, in inbox.html
  const anchorTag = document.createElement('a');
  anchorTag.classList.add("list-group-item", "list-group-item-action");
  // Assigning the email id to anchor css id which will be helpful in retrieving the email details later
  anchorTag.id = email["id"];
  const sender = document.createElement('strong');
  sender.innerHTML = `${email["sender"]}</br>`;
  anchorTag.appendChild(sender);
  const subject = document.createTextNode(`${email["subject"]}`);
  anchorTag.appendChild(subject);
  timestamp = document.createElement('p');
  timestamp.classList.add('text-muted');
  timestamp.innerHTML = `${email["timestamp"]}`;
  anchorTag.appendChild(timestamp);
  const emailsList = document.querySelector("#emails-list");
  emailsList.appendChild(anchorTag);
}
function sendEmailHandler(event) {

  // call an asynchronous function to send POST request to the server
  sendEmail();
  // prevent the form's default submitting behaviour
  event.preventDefault();
}
async function sendEmail(event) {
  const recepients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  try {
    const response = await fetch('/emails', {
      method: "POST",
      body: JSON.stringify({
        recipients: recepients,
        subject: subject,
        body: body
      })
    })
    if (!response.ok) {
      const result = await response.json();
      alert = document.querySelector('#compose-alert')
      alert.style.display = 'block';
      alert.textContent = result["error"];
      throw new Error(`HTTP error: ${response.status}`);
    }
    const result = await response.json();
    load_mailbox('sent');
  }
  catch (error) {
    console.error(`Could not send email: ${error}`);
  }



}

function replyHandler(event) {
  compose_email();
  currentEmail = JSON.parse(localStorage.getItem("currentEmail"));
  document.querySelector('#compose-recipients').value = currentEmail["sender"];

  // Prefill the subject field
  if (currentEmail["subject"].includes("Re: ")) {
    document.querySelector('#compose-subject').value = `${currentEmail["subject"]}`;
  }
  else {
    document.querySelector('#compose-subject').value = `Re: ${currentEmail["subject"]}`;
  }
  // Prefill the body
  document.querySelector('#compose-body').value = `On ${currentEmail["timestamp"]}, ${currentEmail["sender"]} wrote:\n${currentEmail["body"]}\n-----\n`;
  document.querySelector('#compose-alert').textContent = '';
}

