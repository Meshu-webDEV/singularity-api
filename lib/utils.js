const bcrypt = require("bcrypt");
const { nanoid, customAlphabet } = require("nanoid");
const { errorMessages } = require("./constants");

/**
 *
 * @param {Number} size
 * @default 21
 * @returns {Promise<String>} a uniqueid
 */
function createUniqueId(size = 21) {
  return new Promise(async (resolve, reject) => {
    try {
      const uniqueId = await nanoid(size);
      resolve(uniqueId);
    } catch (error) {
      console.log(error);
      reject("Error creating a unique ID");
    }
  });
}

/**
 *
 * @param {Number} size
 * @param {String} custom Custom alphabet
 * @default 21
 * @returns {Promise<String>} a uniqueid
 */
function createUniqueCustomId(size = 4, custom = "1234567890") {
  return new Promise(async (resolve, reject) => {
    try {
      const alphabeticalId = await customAlphabet(custom, size)();
      resolve(alphabeticalId);
    } catch (error) {
      console.log(error);
      reject("Error creating a unique ID");
    }
  });
}

/**
 *
 * @param {Number} size
 * @default 21
 * @returns {Promise<String>} a uniqueid
 */
function createUniquePassword(size = 21) {
  return new Promise(async (resolve, reject) => {
    try {
      const alphabeticalPassword = await customAlphabet(
        "1234567890abcdefghiklmnopqrstvxyz",
        size
      )();
      const specialCharacters = await customAlphabet("!@#$%^&*", 2)();
      resolve(`${alphabeticalPassword}${specialCharacters}`);
    } catch (error) {
      console.log(error);
      reject("Error creating a unique ID");
    }
  });
}

function hashPassword(password) {
  return new Promise(async (resolve, reject) => {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      return resolve(hashedPassword);
    } catch (error) {
      console.log("Error hashing the password");
      return reject(error);
    }
  });
}

function checkPassword(password, hashedPassword) {
  return new Promise(async (resolve, reject) => {
    try {
      const isMatching = await bcrypt.compare(password, hashedPassword);

      return resolve(isMatching);
    } catch (error) {
      console.log("Error unhashing and matching the password");
      console.log(error);
      return reject();
    }
  });
}

function normalize(string = "") {
  return string.toString().replace(/ /g, "").toLowerCase();
}

function htmlTemplate(username, activationLink) {
  return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
    <title>Email Activation</title>
    <!-- <link rel="stylesheet" href="main.css"> -->
</head>

<style>
    html {
        background-color: var(--light-gray);
    }

    :root {
        font-family: 'poppins';
        --primary-color: #f10041;
        --secondary-color: #07b85c;
        --dark-white: #c8c8c8;
        --dark-black: #0b0b0e;
        --bg-dark: #1a1f27;
        --bg-darker: #151920;
        --bg-darkest: #0b0d13;
        --info: #339fde;
        --dark-gray: #1e242b;
        --light-gray: #21282f;
    }

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    .container {
        padding: 1rem 14rem 1rem 14rem;
        display: flex;
        flex-direction: column;

    }

    .container-content {
        padding: 4rem 0rem 0rem 0rem;
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .description {
        margin: 16px 0px 16px 0px;
        align-self: flex-start;
    }

    .hr {
        width: 100%;
        opacity: 10;
        border-color: rgba(255, 255, 255, 0.03);
    }

    .header {
        position: relative;
        color: var(--primary-color);
        max-width: fit-content;
        text-decoration: none;
        font-size: 3rem;
        letter-spacing: 0.12rem;
        display: flex;
        justify-items: center;
        align-items: center;
        flex-direction: row;
        align-self: center;
        text-transform: uppercase;
    }

    .header-logo {
        width: 40px;
        height: 40px;
    }

    .sub-header {
        padding: 12px 0px;
        color: var(--dark-white);
        font-size: 0.75rem;
        text-align: center;
    }

    .header-subtitle {
        position: absolute;
        opacity: 30%;
        top: 60%;
        right: -35px;
        transform: translateY(-50%);
        color: var(--dark-white);
        font-size: 1rem;
        letter-spacing: initial;
        font-style: italic;
    }

    .header div {
        margin: 0px 16px;
    }

    .activate-btn {
        display: flex;
        flex-direction: row;
        flex-grow: 0;
        max-width: min-content;
        font-weight: 600;
        background-color: var(--primary-color);
        text-decoration: none;
        color: white;
        white-space: nowrap;
        align-self: flex-start;
        padding: 8px 14px;
        border-radius: 8px;
    }

    .activate-btn>* {
        margin: 0px 6px;
    }

    .activate-btn-icon {
        width: 28px;
        height: 28px;
        padding-bottom: 1px;
    }

    .option {
        padding-left: 6px;
        font-size: 0.85rem;
        color: var(--dark-white);
        align-self: flex-start;
    }

    .option-text {
        margin-left: 0.75rem;
    }

    .option-url {
        font-size: 0.95rem;
        font-style: italic;
        margin-top: 8px;
        margin-bottom: 2rem;
        padding: 8px;
        border-radius: 8px;
        background-color: var(--bg-darker);
        max-width: min-content;
        white-space: pre-line;
    }

    .footer {
        display: flex;
        flex-direction: column;
        font-size: 0.7rem;
        align-self: center;
        align-items: center;
        margin-top: 4rem;
    }

    .note {
        padding: 1rem 0rem;
        font-size: 0.8rem;
        color: var(--dark-white);
        opacity: 70%;
        font-weight: 300;
    }

    .opaquelabs {
        color: var(--info);
    }

    @media (min-width: 1200px) {
        .container {
            max-width: 90%;
        }
    }

    @media (max-width: 750px) {


        .container {
            padding: 1rem 8rem 1rem 8rem;
        }
    }

    @media (max-width: 570px) {


        .container {
            padding: 1rem 5rem 1rem 5rem;
        }
    }

    @media (max-width: 500px) {


        .container {
            padding: 1rem 4rem 1rem 4rem;
        }

        .header {
            font-size: 2rem;
        }

        .header-subtitle {
            right: -40px;
        }

        .header-logo {
            width: 30px;
            height: 30px;
        }
    }

    @media (max-width: 450px) {


        .description p {
            font-size: 0.85rem;
        }

        .activate-btn {
            padding: 6px 12px;
        }

        .activate-btn span {
            font-size: 0.95rem;
        }

        .container {
            padding: 1rem 2rem 1rem 2rem;
        }

        .header {
            font-size: 1.75rem;
        }

        .header div {
            margin: 0px 10px;
        }

        .header-subtitle {
            right: -45px;
        }

        .header-logo {
            width: 30px;
            height: 30px;
        }
    }
</style>

<body>
    <div class="container">

        <!-- Content -->
        <!-- Header -->
        <a href="https://www.singularity.events" target="_blank" class="container-item header">
            <img class="header-logo"
                src="https://image-testing.fra1.digitaloceanspaces.com/singularity-logo-primary-1x2.png" alt="logo">
            <div>SINGULARITY <span class="header-subtitle">.events</span></div>
        </a>
        <hr class="hr">
        <div class="sub-header">Your all in one platform for for organizing Events, tournaments & scrims for Apex
            Legends</div>
        <div class="container-content">
            <div class="description">
                <!-- Description -->
                <p style="font-size: larger; font-weight: 500;"><span
                        style="font-style: italic; font-weight: 300">Awesome</span>
                    Meshari ..</p>
                <br>
                <br>
                <p>Thank you for joining us at <span style="font-weight: 600;">Singularity</span>. We are pleased to
                    have you! 🌹</p>
                <p>To validate & activate your email, please click the button below:</p>
                <br>
                <br>

            </div>
            <!-- Call to action -->
            <a class="activate-btn" href="http://www.google.com" target="_blank" rel="noopener noreferrer">
                <span>Activate your account</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="activate-btn-icon" viewBox="0 0 20 20"
                    fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd" />

                </svg>
            </a>
            <br>
            <br>
            <br>

            <!-- Footer -->
            <div class="footer">
                <!-- note -->
                <div class="note">If you did not sign-up with us. sorry for bothering, you can ignore this email</div>
                <span>
                    Copyright © 2021 - <a class="opaquelabs" target='_blank' href='https://www.meshu-web.dev/'>
                        meshu-web.dev </a> - All
                    rights reserved
                </span>
            </div>
        </div>

    </div>
</body>

</html>`;
}

module.exports = {
  hashPassword,
  checkPassword,
  createUniqueId,
  createUniqueCustomId,
  createUniquePassword,
  normalize,
  htmlTemplate,
};
