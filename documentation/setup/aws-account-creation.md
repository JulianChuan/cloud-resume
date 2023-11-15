# AWS Account Creation for Cloud Resume Challenge

## Step 1: Signing Up for AWS
- Go to [aws.amazon.com](https://aws.amazon.com/) and click on **Create an AWS Account** at the top right of the screen.
- In order to create an account, you will need to enter the *Root user email address* and an *AWS account name*.
  - The *Root user email address* serves as the primary contact for the AWS account and received important notifications and alerts related to the account.
  - The *AWS account name* is a user-defined name given to an AWS account to help identify the account within the AWS Management Console and verious AWS services.

### Step 1.1: Creating the General AWS Account
- Most businesses and projects will use more than 1 AWS account. Rather than using a sandbox account or using a single AWS account, I'm going to create a few accounts. Later on, I will link these accounts together using AWS Organizations.
- The format I will be using is `example+resumegeneral@email.com` for my *Root user email address* and `example-cloud-resume-general` for my *AWS account name*. <br>
Next, verify your account.
- It is considered a best practice to utilize a password manager like *Bitwarden* for securely storing and generating credentials. Enter your password and click **Continue**.
- Because this is a personal project, I will select the **Personal** plan and continue with my contact information. Click **Continue**.
- AWS requires a payment method on file, but WILL NOT charge you for usage below the *AWS Free Tier* limits. Click **Verify and Continue**.
- Pick the method of identity verification and type in the captcha. I chose to receive a text message so will click **Send SMS**.<br>
Wait to receive the text and then verify the code. Click **Continue**.
- For training accounts I will default to using the *Basic support - Free* plan. This will provide just enough support if any account or billing issues were to arise. Lastly, click on **Complete sign up**. <br>
At this point, you should see a *Congratulations!* screen which tells you that AWS is activating your account.

### Step 1.2: Enable IAM User and Role Access to Billing Info
- If you are still on the *Congratulations!* screen, you can go ahead and click on **Go to the AWS Management Console**. Otherwise, go to [aws.amazon.com/console/](https://aws.amazon.com/console/) and click on **Log back in**.
- We will be logging in via the *General Root User* so select **Root user** and enter the associated email address. Click **Next** then enter your password and **Sign in**.
- Click on the account drop down at the top right and then move to **Account**. If you scroll down a little bit, you should see *Alternate contacts*. I want to call this out because if you're creating an AWS account for business reasons, then often times you might have different billing operations and security contacts - I will be skipping this.
- Continue scrolling down until you see *IAM user and role access to Billing information* and click on **Edit**. Check the *Activate IAM Access* and click on **Update**. This is going to make sure that if you're logged in as an IAM Identity, then you have full access to the billing console, provided you have permissions. If this box wasn't checked, then even if we gave an IAM identity full admin permissions, it wouldn't be able to access the billing console.
