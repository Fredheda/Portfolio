# Deployment Guide

This guide will help you deploy your frontend and backend applications to Heroku.

## Prerequisites

Before you begin, make sure you have the following installed:

- [Git](https://git-scm.com/)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

## Steps

### Deploying the Frontend Application

1. **Navigate to your project directory:**

    ```sh
    cd Portfolio
    ```

2. **Login to Heroku:**

    If you haven't logged in to Heroku CLI yet, run the following command and follow the instructions:

    ```sh
    heroku login
    ```

3. **Add Heroku remote for the frontend:**

    ```sh
    heroku git:remote -a frederik-heda-portfolio
    ```

4. **Deploy your frontend application:**

    Use the following command to push your frontend code to Heroku.

    ```sh
    git subtree push --prefix frontend heroku main
    ```

### Deploying the Backend Application

1. **Navigate to your backend project directory:**

    ```sh
    cd Portfolio
    ```

2. **Add Heroku remote for the backend:**

    ```sh
    heroku git:remote -a frederik-heda-backend
    ```

3. **Deploy your backend application:**

    Use the following command to push your backend code to Heroku. 

    ```sh
    git subtree push --prefix backend heroku main
    ```

## Additional Information

- **Heroku Dashboard:**

    You can manage your apps from the Heroku Dashboard: [https://dashboard.heroku.com/](https://dashboard.heroku.com/)

- **Environment Variables:**

    This application requires environment variables for the frontend and the backend. They can set them using the Heroku CLI:

    ```sh
    heroku config:set YOUR_VARIABLE_NAME=some_value
    ```

- **Logs:**

    To view the logs of your applications, use the following command:

    ```sh
    heroku logs --tail
    ```

## Troubleshooting

- **Common Issues:**

    - **Build Failures:**
        Ensure that your `package.json` and `build` scripts are correctly configured.

    - **Application Errors:**
        Check the logs using `heroku logs --tail` to diagnose any runtime errors.

- **Heroku Documentation:**

    For more detailed information, refer to the [Heroku Documentation](https://devcenter.heroku.com/).

---

By following these steps, the frontend and backend applications to Heroku can be deployed.