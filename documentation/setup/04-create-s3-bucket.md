# Static Website Hosting

## Step 1: Creating an S3 Bucket
- Log into the *IAM Admin User* of the *General* AWS account.
- From the *Console Home*, you will see a *Search* bar at the top of the screen. Search and click on `S3` to open the *S3 dashboard*. Click **Create bucket**.
- My *Bucket name* will be `firstlast.com` and I will be selecting *US East (N. Virginia) us-east-1* as my AWS Region.
- I am going to uncheck *Block all public access*, but the other configurations can be left on default:
  - Bucket type: *General purpose*
  - Object Ownership: *ACLs disabled (recommended)
  - Bucket Versioning: *Disable*
  - Default encryption: *Server-side encryption with Amazon S3 managed keys (SSE-S3)*
  - Bucket Key: *Enable*
  - Advanced settings: *Disable*

The *Block all public access* checkbox is a safety precaution. Unchecking this box means that we will be able to grant public access. It does not mean that public access is granted automatically.
> You will need to acknowledge that you understand the risks of unticking by selecting *I achknowledge that the current settings might result in this bucket and the objects within becoming public.*
- Click **Create bucket**
- Click on the bucket you just created under the *General purpose buckets* section.
- Navigate to the *Properties* tab and scroll to the bottom.
- In the *Static website hosting* box, click on **Edit**.
- Select *Enable*. When you see the additional properties then appear, select *Host a static website*.
- Under *Index document*, type in `index.html`. Similarly for the *Error document - optional*, we're going to type in `error.html`.
- Click **Save changes**.

## Step 2: Organizing Your S3 Bucket
### Step 2a: Creating a Folder
- From the *Buckets* dashboard, scroll down to *General purpose buckets* and click on the bucket we just created.
- To keep things organized and consistent, I will be structing my S3 bucket similar to this repo. Make sure you are on the *Objects* tab, and click **Create folder**.
- For my *Folder name*, I will be using `assets`. You can name this whatever you'd like but this directory is where I will be storing files such as a profile picture.
- For the *Server-side encryption*, I will be selecting *Do not specify any encryption key*.
> Although there might not be immediate critical needs for encryption, understanding the encryption options available, potential areas where encryption may be needed, and adopting good security practices is beneficial for security principles. Additionally, we have the flexibility to enable encryption on objects after they have been uploaded.
- Click **Create folder** when ready.

We will now repeat the same steps in [Step 2a](#step-1a-creating-a-folder) for our second folder. The only difference this time is I will be creating a `code` folder. Here is where we'll store actual code files that provide the functionality of our website such as scripts and HTML.

### Step 2b: Creating a Subfolder
I intent to structure my codebase into distinct sections for both frontend and backend components.
- Now that we have our *assets* and *code* folders, click to open the *code/* folder from the *Objects* tab.
- At the top of your screen, you can follow the directory to ensure we are within our *code/* folder. Click on **Create folder**.
- Under *Folder name*, I will call this `frontend` and then select *Do not specify an encryption key*.
> Again, encrypting these files/folders might not be necessary, especially if they don't contain sensitive data.
- Click **Create folder**.

Similarly as before, we will now designate our *backend* folder. Follow [Step 2b](#step-2b-creating-a-subfolder) with the following changes:
- Name the new subfolder `backend`.

## Step 3: Uploading Objects
Objects are the fundamental entities stored in Amazon S3.
- When you navigate to the *Objects* tab and see an orange **Upload** button, go ahead and click it.
- Click on **Add files** and select the following files:
  - *index.html*
  - *error.html*
  > Amazon S3 serves content directly based on the object's URL path within the bucket. Placing *index.html* and *error.html* in the root folder ensures that when users access your website's root URL or any subdirectory without specifying a specific file, that these 2 files will be served as the default page.
- Verify the *Destination* is correct. We should upload these 2 objects into our root directory. It should look something like `s3://bucketname`. If this is correct, then **Upload**. Everything else can be left on default. **Close** when upload succeeds.
- Return to the *Objects* tab, and open your *assets/* folder.
- Click **Upload**, **Add files**, and select your profile picture.
- Verify the *Destination*, **Upload**, and **Close**.
- At the top of your screen, click on *your bucket name* to return to our root folder.
- Open your *code/* folder then open the *frontend/* folder we made.
- Click on **Upload** and **Add files**. Here is where we'll upload our:
  - *styles.css*
  - *script.js*
- Verify the *Destination*, click **Upload**, and **Close** out when completed.

## Step 4: Adding a Bucket Policy
Currently we have no method of providing any credential to S3 when we're accessing objects via static website hosting. We need to give permissions to any unauthenticated or anonymous users to access the objects within our bucket.

- From the *S3 Buckets* dashboard, select your bucket and navigate to the *Permissions* tab.
- Scroll to the *Bucket policy* section and click on **Edit**.
- In a separate window or tab, copy the code from the [public-read-access-policy file](Code/backend/public-read-access-policy.json).
  - It should look like this:
      ```json
      {
          "Version":"2012-10-17",
          "Statement":[
              {
                  "Sid":"PublicRead",
                  "Effect":"Allow",
                  "Principal": "*",
                  "Action":["s3:GetObject"],
                  "Resource":["arn:aws:s3:::examplebucket/*"]
              }
          ]
      }
      ```
- Paste this into your *Policy* statement.
- Just above the *Policy* code editor, you will see your *Bucket ARN*. It should look similar to `arn:aws:s3:::bucketname`. Copy this *Bucket ARN*.
- In the *Policy* statement, you will find the *Resource* element nested within the *Statement* element. We are going to replace everything in the template code except for `/*` at the very end.
  - Once you pasted in your ARN, your entire *Resource* element should look like<br>
  `"Resource":["arn:aws:s3:::firstlast.com/*"]`
- **Save changes**.
