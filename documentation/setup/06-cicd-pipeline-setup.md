# CI/CD Pipeline
<sub> The instructions below will assume your source code is hosted on GitHub. </sub>

## Create IAM User
### Specify User Details
- From AWS, navigate to the *IAM dashboard*.
- Select **Users** from the left hand menu and click **Create user**.
- Enter a *user name* for your CI/CD pipeline, like `github-cicd-user`.
- Click **Next**.

#### Set Permissions
- We will select *Attach policies directly* and click **Create policy**. This should open a new tab where we can specify permissions.
- Keeping the Principle of Least Priviledge in mind, we can either use the *Visual* or *JSON* policy editor to create a new policy solely for our GitHub Actions.
  - You can copy mine from [here](../../code/backend/github-cicd-user-policy.json).
  - It should look like this:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ListBucketContents",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::examplebucket"
            ]
        },
        {
            "Sid": "ReadWriteBucketObjects",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": [
                "arn:aws:s3:::examplebucket*"
            ]
        }
    ]
}
```


  
- Once the appropriate permissions are set, click **Next**.
#### Review and Create
- For the *policy name*, I will be using `GithubCICDAccess`.
- Once you have entered a name, click **Create policy**.

### Attach New Policy
- Once the new policy has been created, we can close the tab and return to the *IAM dashboard*.
- Under *permissions policies*, search for the newly created policy. You may need to refresh the page.
- Select the IAM policy and click **Next** then **Create user**.

## Set Up GitHub Secrets

### Create Access Keys
- From AWS, navigate to the *IAM dashboard* and select the *github-cicd-user* we created.
- Click on **Create access key**. Select *Third-party service* then click **Next**.
  - You may need to confirm that you *understand the above recommendation and want to procees to create an access key*.
- You can *set description tag* if you choose. Otherwise, click **Create access key**.
- Download or copy the keys then click **Done**.
> It's VERY important to either download the key file or copy the *Access Key ID* and *Secret Access Key* and store them securely. If you lose or forget your secret access key, you cannot retrieve it. Instead, create a new access key and make the old key inactive.

### Store Access Keys
- From GitHub, navigate to where your static website's code is located.
- At the top of the screen, you should see **Settings**.
- On the left hand side, look for *Secrets and variables* and select *actions*. Click on **New repository secret**.
- Enter a *name* for your secret. I will be using `AWS_ACCESS_KEY_ID`.
- Paste in your key under the *secret* field and click **Add secret**.
- We will now repeat this process 2 more times for our `AWS_SECRET_ACCESS_KEY` and `AWS_S3_BUCKET`.

## Set Up GitHub Actions

### Create Workflow
- Navigate to your repo and click on **Actions** in the tab options at the top of the screen.
- We will be building a new workflow so click on **set up a workflow yourself**. This will create a new `main.yml` file under a `.github/workflows` directory in your repo.
  - Optionally, you can choose another name. I will be using `deploy-to-s3.yml`
- Here is an example you can adjust as needed:
  ```yaml
  name: Deploy to S3
  
  on:
    push:
      branches:
        - main # Change this to your main branch name
  
  jobs:
    deploy:
      runs-on: ubuntu-latest
  
      steps:
        - name: Checkout repository
          uses: actions/checkout@v2
  
        - name: Configure AWS credentials
          uses: aws-actions/configure-aws-credentials@v1
          with:
            aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
            aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            aws-region: your-aws-region # Replace with your AWS region
  
        - name: Deploy to S3
          uses: aws-actions/aws-s3-deploy@v2
          with:
            bucket-name: your-s3-bucket-name
            local-path: ./path/to/local/directory # Replace with the local directory containing the files you want to deploy
            overwrite: true # Set to true if you want to overwrite existing files in the bucket
  ```
  > Make sure to replace the placeholders `your-aws-region`, `your-s3-bucket-name`, and `./path/to/local/directory` with your actual AWS region, S3 bucket name, and local directory path respectively. Additionally, you need to set up AWS access keys as GitHub secrets named `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with the appropriate IAM permissions to access the S3 bucket.This workflow will trigger on every push to the `main` branch and deploy the contents of the specified local directory to the specified S3 bucket using AWS credentials configured via secrets.
- When completed, click on **Commit changes...** then **Commit changes**.
