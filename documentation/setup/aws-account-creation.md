# AWS Account Creation for Cloud Resume Challenge

## Step 1: Signing Up for AWS
- Go to [aws.amazon.com](https://aws.amazon.com/) and click on **Create an AWS Account** at the top right of the screen.
- In order to create an account, you will need to enter the *Root user email address* and an *AWS account name*.
  - The *Root user email address* serves as the primary contact for the AWS account and received important notifications and alerts related to the account.
  - The *AWS account name* is a user-defined name given to an AWS account to help identify the account within the AWS Management Console and verious AWS services.

### Step 1a: Creating the General AWS Account
Most businesses and projects will use more than 1 AWS account. Rather than using a sandbox account or using a single AWS account, I'm going to create a few accounts. Later on, I will link these accounts together using AWS Organizations.

The format I will be using is `user+resumegeneral@example.com` for my *Root user email address* and `user-cloud-resume-general` for my *AWS account name*.
- Once you have entered the email and chosen the *AWS account name*, click **Verify email address**.
- It is considered a best practice to utilize a password manager like *Bitwarden* for securely storing and generating credentials. Enter your password and click **Continue**.
- Because this is a personal project, I will select the **Personal** plan and continue with my contact information. Click **Continue**.
- AWS requires a payment method on file, but WILL NOT charge you for usage below the *AWS Free Tier* limits. Click **Verify and Continue**.
- Pick the method of identity verification and type in the captcha. I chose to receive a text message so will click **Send SMS**.<br>
Wait to receive the text and then verify the code. Click **Continue**.
- For training accounts I will default to using the *Basic support - Free* plan. This will provide just enough support if any account or billing issues were to arise. Lastly, click on **Complete sign up**. <br>
At this point, you should see a *Congratulations!* screen which tells you that AWS is activating your account.

### Step 1b: Enable IAM User and Role Access to Billing Info
- If you are still on the *Congratulations!* screen, you can go ahead and click on **Go to the AWS Management Console**. Otherwise, go to [aws.amazon.com/console/](https://aws.amazon.com/console/) and click on **Log back in**.
- We will be logging in via the *General Account Root User* so select **Root user** and enter the associated email address. Click **Next** then enter your password and **Sign in**.
- Click on the account drop down at the top right and then move to **Account**. If you scroll down a little bit, you should see *Alternate contacts*.<br>
I want to call this out because if you're creating an AWS account for business reasons, then often times you might have different billing operations and security contacts - I will be skipping this.
- Continue scrolling down until you see *IAM user and role access to Billing information* and click on **Edit**. Check the *Activate IAM Access* and click on **Update**. This is going to make sure that if you're logged in as an IAM Identity, then you have full access to the billing console, provided you have permissions. If this box wasn't checked, then even if we gave an IAM identity full admin permissions, it wouldn't be able to access the billing console.

## Step 2: Configuring Your Account

### Step 2a: Adding Multi-Factor Authentication (MFA)
MFA is a simple best practice that adds an extra layer of protection on top of your username and password. With MFA enabled, when a user signs in to an AWS Management Console, they will be prompted for their username and password, as well as for an authentication code from their AWS MFA device. Taken together, these multiple factors provide increased security for your AWS account settings and resources.
- Log in as the *Account Root User* of the *General* AWS Account.
- From the Console Home of the *General* account, click on the account drop down at the top right and select **Security credentials**.
- Scroll down to *Multi-factor authentication* and click on **Assign MFA device**.
- Enter a meaningful name to identify this device such as `AUTH-APP` and then choose your MFA device - I will be using an *Authenticator app*. Click **Next**.

<sub>The instructions below will assume you have also chosen an *Authenticator app* </sub>

  - Open your authenticator app, choose **Show QR code** on this page, then use the app to scan the code. Alternatively, you can type a secret key but I will be using my mobile device.
  - Fill in 2 consecutive codes from your MFA device then click **Add MFA**.

### Step 2b: Creating a Budget
Controlling costs within AWS is important if you want to avoid any bill shock at the end of the month. We will create a budget which will notify you in the event that your estimated monthly costs exceed agreed amount.
- Make sure you are logged in as the *Account Root User* of the *General* AWS account. Click the account drop down at the top right and select **Billing Dashboard**.
- On the left sidebar menu, click on **Billing preferences**.
- We'll go over a few best practices. **Edit** the *Invoice delivery preferences*. Check the box that says *PDF invoices delivered by email* and click **Update**.
- Similarly, **Edit** the *Alert preferences*. We will check *Receive AWS Free Tier alerts* and specify the recipient's email address then **Update** it.
- From the same left sidebar menu, click on **Budgets** and then **Create a budget**.
- Given this is our first time, we will *Use a template (simplified)* and I'm choosing *Zero spend budget*. This way I will be notified as soon as my account exceeds the AWS Free Tier limits.
- It is optional if you want to provide a *Budget name*, but I will be specifying the *email recipients* for the alerts. Lastly, click **Create budget**.

## Step 3: Creating the Production Account
Having separate AWS accounts for different purposes such as a *General* account and a *Production* account is a best practice for several reasons. By adopting this approach of using separate accounts for different purposes, organizations can achieve better security, resource management, and operational efficiency within their AWS infrastructure.

We will be starting from [Step 1](#step-1-signing-up-for-aws), however I will detail the slight adjustments for our *Production* account.
- Here are the following changes in [Step 1a](#step-1a-creating-the-general-aws-account):
  - change the format for *Root user email address* to something like `user+resumeproduction@example.com`.
  - apply the same formatting to the *AWS account name*. It should look similiar to `user-cloud-resume-production`.
- As for [Step 1b](#step-1b-enable-iam-user-and-role-access-to-billing-info), [Step 2a](#step-2a-adding-multi-factor-authentication-mfa), and [Step 2b](#step-2b-creating-a-budget):
  - everything is the same expect we will be using our *Production* account instead of the *General* account.
