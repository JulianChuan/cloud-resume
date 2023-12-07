# Configure DNS
## Setting Up Route 53
- Go to the *Route 53* console. From the left-hand menu, click on *Hosted zones*. Here you should see the hosted zone that matches the domain that you registered in [Step 2](...).
- Click on your *Hosted zone name* and then **Create record**. If you are prompted to *Choose routing policy*, then *Switch to quick create*.
- Under the *Record name*, we're going to leave the subdomain blank. For the *Record type*, make sure to select *A - Routes traffic to an IPv4 address and some AWS resource*.
- Toggle on the *Alias* switch and you should see *Route traffic to* and *Routing policy*.
- In the *Choose endpoint* dropdown menu, select *Alias to S3 website endpoint*.
- In the *Choose Region* dropdown menu, select your region. For example, mine is *US East (N. Virginia)*.
- The final dropdown should automatically appear where you can choose the S3 bucket we created in [Step 1](create bucket).
> If nothing shows up here, it's likely because you didn't name your bucket the same as your domain name. If this is the case, then see [Step 2](creating bucket) to recreate the bucket with the exact name of your domain.
- Choose the *Simple routing* and you can leave *Evaluate target health* toggled on. Click **Create records**.

## Creating a Public TLS/SSL Certificate
- Navigate to the *Certificate Manager* console by searching in the bar at the top of the screen.
- In this section, be sure to switch your region to *US East (N. Virginia) us-east-1*.
- From the *Certificate Manager* dashboard, click on **Request a certificate**.
- Select *Request a public certificate* and click **Next**.
- For the *Fully qualified domain name*, enter in your domain name like `firstlast.com`. Everything else can be defaulted to:
  - *DNS validation - recommended*
  - *RSA 2048*
- Click **Request**.

If the request was successful, you should see a blue banner at the top of the screen. It should say something like *Successfully request certificate*, but will have a pending validation status until we validate DNS.
- Click the **View certificate** button inside this banner.
- Scroll to the *Domains* section and click on **Create records in Route 53**.
- There should be various filters already applied for you. Make sure your domain is selected and click **Create records**.

  ## Creating a CloudFront Distribution
  - Navigate to the *CloudFront* console and click on **Create a CloudFront distribution**.
  - Click *Choose origin domain* and select your S3 bucket. You should see a popup saying *This S3 bucket has static web hosting enabled*. Click on **Use wbesite endpoint**.
  - Most of the settings can be defaulted, but scroll down to *Default cache behavior*. Under *Viewer protocol policy*, select *Redirect HTTP to HTTPS*.
  - Continue scrolling until you see *Web Application Firewall (WAF)*. I will be selecting *Do not enable security protections*.
  - Continue scrolling to the *Settings*.
  - Under *Alternate domain name (CNAME) -optional*, click **Add item** and enter your domain like `firstlast.com`.
  - For the *Custom SSL certificate - optional*, choose the ACM certificate we created in [Step 2](creating certificate).
  - Scroll just below to *Default root object - optional*. Set this to `index.html` and click **Create distribution**.
 
  ## Pointing Route 53 to the CloudFront Distribution
  - Return to the *Route 53* console, navigate to the *Hosted zones* dashboard, and click on your hosted zone.
  -  You will see a couple of *Records* listed, but select the *Type A* record then click **Edit record**.
  -  We will now update the *Route traffic to* from *Alias to S3 website endpoint* to the *Alias to CloudFront distribution*.
  -  *Choose distribution* and select the new CloudFront distribution we created in [Step 3](create cfd).
  -  The rest can be defaulted and then click **Save**.
