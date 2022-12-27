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
  document.querySelector('#compose-alert').textContent = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#compose-alert').style.display = 'none';

  // Show the mailbox name
  document.querySelector("#mailbox-name").innerHTML=`<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
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
    for (const email of result) {
      const emailItem = document.createElement('li');
      emailItem.classList.add('list-group-item');
      const sender = document.createElement('strong');
      sender.innerHTML = `${email["sender"]}</br>`;
      emailItem.appendChild(sender);
      const subject = document.createTextNode(`${email["subject"]}`);
      emailItem.appendChild(subject);
      timestamp = document.createElement('p');
      timestamp.classList.add('text-muted');
      timestamp.innerHTML = `${email["timestamp"]}`;
      emailItem.appendChild(timestamp);
      document.querySelector("#emails-list").appendChild(emailItem);
    }
  }
  catch (error) {
    console.error(`Could not retrieve mailbox: ${error}`);
  }


}

function send_email_handler(event) {
  send_email();
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
