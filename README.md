External module that allows patients to communicate with physicians in a chat room style HIPAA compliant application.

# Building UI
-  Ui is built using react and must be prebuilt before pushing to production
-  `npm run build` will transpile the code using vite
-  For hot reloading, `npm run dev` will start the development server


# Project setup
- This project requires extensive setup to work properly, please follow all of the instructions closely.


### Arm 1 - Therapy sessions
Therapy sessions will house all the information pertaining to a given chat room session.
These will need to be created beforehand manually similar to the following example:

- Participant's record ID's should be placed in the `Authorized Particpants` field in a comma delimited list
