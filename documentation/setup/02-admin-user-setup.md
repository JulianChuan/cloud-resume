# Admin User Setup
To further secure both the *General* and *Production* AWS accounts, we are going to create an IAM identity. In general, we don't want to use the *Account Root User* for anything for production usage because it's not possible to restrict, delete, or recreate the *Account Root User*.<br>
Typically when you finish creating an AWS account, you should then create a *normal admin user* which will be given full control over the account.

## Step 1: Create an Account Alias
- Log into the *Account Root User* of the *General* AWS account.
- From the *Console Home*, you will see a *Search* bar at the top of the screen. Search and click on `IAM` to open the *IAM dashboard*.
- You should see *AWS Account* modal on the right hand side. Within that modal, click on **Create** under *Account Alias*. The *Account Alias* needs to be globally unique and will help with clarity.
  - For my *Preferred alias*, I will be using the format of `user-resume-general`. Make sure to include `general` to provide a better experience when identifying which AWS account you're logging into.
  - Then click **Create alias**.

## Step 2: Specify IAM User Details
- From the *IAM Dashboard*, click on **Users** then **Create user**.
- This *User name* does not have to be unique so I will be using `iamadmin`. Check the *Provide user access to the AWS Management Console - optional* box and select *I want to create an IAM user*.
- If you have selected *I want to create an IAM user*, then you should see *Console password* appear below. I will be using *Bitwarden* to generate a custom password.
  > Be sure to note your Password down
- Typically you want to allow this IAM user to create their own password once they've signed in for the first time. I will uncheck where it says *Users must create a new password at next sign-in (recommended)* because this is my personal IAM identity that I will be using. Click **Next**.

Initally, the *iamadmin* won't have any permissions except those to change the password and basic interaction permissions for the AWS console.
- Click on *Attach policies directly*. You should see *Permissions policies* and check the box for *AdministratorAccess*. This policy grants full admin control over this AWS account and we will be attaching it to our *iamadmin* user. Click **Next**.
- Reivew your choices and click **Create user**. You will be brought to the confirmation page where you can optionally *email sign-in instructions*. Since I am the one who will be using this identity, I will opt out and **Return to users list** then **Continue** back to the IAM *Users* section.

## Step 3: Logging In
- Navigate back to the *IAM Dashboard* and copy the *Sign-in URL for IAM users in this account* under the *AWS Account* modal on the right hand side. This is going to be the URL that you'll use whenever you want to log into the *General* AWS account using this *IAM User* from now on.
  > Be sure to note this URL down.
- Paste the URL into your address bar and hit **Enter**. This will log you out of the *General Root User* account and bring you a slightly different login screen.
- If you've followed these exact steps, the *Account ID* should be pre-populated with our chosen *Account Alias* name.<br>
  **Enter** the *IAM user name* and *Password* from the previous steps and **Sign in**.
- This time you will now be logged in as the *iamadmin* user of the *General* AWS account. If you click the account drop down, you will be able this information. If you'll recall, we gave this *IAM user* admin permissions so it does have full control over this account - the same access as the *Root User*.
- The last step we need to do is to [Add MFA](01-aws-account-setup.md#step-2a-adding-multi-factor-authentication-mfa) on our *iamadmin* user.
