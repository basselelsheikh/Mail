document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archived'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email_handler);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}

function send_email_handler(event) {
  send_email()
  //prevent form default submitting behaviour
  event.preventDefault();
}
async function send_email(event) {
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
      document.querySelector('#compose-recipients').value=result["error"];
      throw new Error(`HTTP error: ${response.status}`);
    }
    const result = await response.json();
    load_mailbox('sent');
  }
  catch (error) {
    console.error(`Could not send email: ${error}`);
  }
  


}
