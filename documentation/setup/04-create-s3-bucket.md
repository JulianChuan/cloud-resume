# Static Website Hosting

## Creating an S3 Bucket
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



