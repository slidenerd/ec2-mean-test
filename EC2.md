# How to install Node.js and MongoDB on EC2 the hard way
Hi! I got tired of reading guides on the internet that do no explain anything properly. And sorry to say this but the EC2 docs suck at explaining anything. This guide is designed for people who are total newbies to the whole world of Amazon, Ubuntu, NGINX, LetsEncrypt and what not.

>  **Even if you read 300 more articles on the Internet** I assure you, **this one post will blow away all of them.** **Bookmark it!**

If this post needs an update, [open an issue](https://github.com/slidenerd/ec2-mean-test/issues) Lets GOO!!!

## About my local machine
 1. Experience has taught me that these types of tutorials are super dependent on what my local machine, version etc etc is.
 2. I am on OSX High Sierra 10.13.6
 3. If you are using Windows, some of the steps such as SSH setup will vary significantly but you will be able to follow through the rest of this guide.

## What are we doing in this post ?
 1. How to setup **Ubuntu 18.04** instance on Amazon EC2
 2. **Connect to EC2 with SSH keys** from your local machine
 3. Update Ubuntu and Reboot Instance
 4. Install **Node.js using NVM** on this instance
 5. **Install MongoDB** on the primary partition of this instance but **data, journal and logs** will be stored on different partitions using EBS Volumes
 6. **Optimize** **MongoDB for linux**
 7. How to **secure** the installed **MongoDB** database?
 8. Setup SSH keys between your local machine and GitHub
 9. Setup SSH keys between GitHub and your EC2 instance
 10. How to install **NGINX** to handle traffic on port 80?
 11. How to setup **PM2** to handle process management in production for our website?
 12. **Setup Elastic IP** before getting a domain name
 13. How to setup a custom domain with **Godaddy**?
 14. How to setup **FREE SSL** on the custom domain using **LetsEncrypt/Certbot**? Let's GOO!
	A small note would be that on a true production system, you want to install Node on one instance and MongoDB on another instance. Since this will go beyond the limits of FREE Tier we are going to setup both on the same instance.

# Step 1: Setup Ubuntu instance on EC2
 1. We are going to install Ubuntu 18.04 on EC2.  
 2. Why not Amazon Linux or Amazon Linux 2?
 3. We would prefer that are we not dependent on a single entity for updates to the OS which happens to be Amazon here.
 4. Ubuntu updates more frequently. 
 5. We don't know exactly if Amazon Linux is optimized for our use case or not but any claims for optimization must always be backed by benchmarks specific to our case which we don't have at the moment.

## Create an Account on AWS
 1. Enter email
 3. Enter password
 4. Enter card details (No don't worry, they won't charge you, you are covered by the 1 year FREE tier plan that applies to the services we use in this tutorial)
 7. I have not included any screenshots till the end of this process and there is nothing really new here. Let's move on.

## Go to your Dashboard
![EC2 Dashboard](https://i.imgur.com/ETyy6xr.png)

 1. My account is setup in Ohio, you could be in a different region and the process will remain more or less the same.
 4. **WARNING**! Changing the region means EC2 folks will email you to confirm the same which takes time.

## Step 1.1: Choose Amazon Machine Image
![step 1: choose amazon machine image](https://imgur.com/buMqscB.png)
 1. Notice how the **"Free tier only"** option on the left is checked. 
 2. Also notice on the right hand side of the screen, we got a bunch of select buttons and some of them have an option 64-bit x86 and 64-bit arm.
 4. We go ahead with x86 for the time being.
 5. Click **Select** and let's proceed

## Step 1.2: Choose an Instance Type
![Step 2: Choose an Instance Type](https://imgur.com/WGZhSgz.png)
 1. Instance type dictates how much memory your instance will have.
 2. We have selected t2.micro here which seems to be the only one eligible on Free Tier at the moment.
 5. Click on **"Next Configure Instance Details"** and proceed

## Step 1.3: Configure Instance
![Step 3: Configure Instance](https://imgur.com/VuiJQKQ.png)
 1. Now this page has some really complex settings but luckily we don't have to tweak any of them.
 2. If you are curious about what these settings mean, feel free to Google each one.
 3. Now we click on **Next: Add Storage** and proceed.

## Step 1.4: Add Storage

This is one of the most important steps in our tutorial so far. You have several choices to decide how MongoDB is run.
 1. Use MongoDB from a third party Database-As-A-Service provider such as MLabs, Compose etc. (No thanks,we'll pass)
 2. Create a separate instance that only hosts MongoDB. (This will cost us in the Free Tier to have more than once instance running)
 3. Install MongoDB + everything else on the same partition. (Simplest possible setup but not scalable in the long run when your DB starts growing)
 4. Install MongoDB + everything else on the  same partition but let the database, journal files and logs be stored in separate partitions to accommodate our ever growing collections. **(BINGO! That is the approach we are going to follow)**
**We are going to use EBS to setup 3 additional volumes of 16 GB, 4 GB and 2 GB.**
 6. Amazon offers Elastic Block Storage Volumes (EBS Volumes).
 7. Think of EBS Volumes as portable hard drives on your PC. One of them is getting full? No probems, just buy another one and start storing data in it.
![Step 4: Add Storage](https://imgur.com/tzi5AqC.png)
 8. We get 30 GB (as of writing this post) for our instance out of which 8GB has been allocated to our instance. This 8GB will store our OS files for Ubuntu, Node, Nginx, Certbot and other tools and updates plus MongoDB (without the actual database)
 9. We still have 22 GB left which we can allocate separately to EBS Volumes as 16GB (data) + 4GB (journal) + 2GB (logs)
 12. To do so, click on **Add New Volume** where you will be able to add 16, 4, 2 GB one by one.
 ![Step 4: Add Storage EBS Volumes](https://imgur.com/c4tDxod.png) 
 13. The above screen now represents my added volumes. Though we have selected General Purpose SSD or gp2 volumes here, ideally you should be selected IOPS Volumes for production.
 14. Notice how **Delete on Termination** is set only for the primary volume. As you probably guessed, if you terminate the instance, you will lose all the data on that volume. 
 16. if you already have a running instance and did not do this step, no worries, go to your **Dashboard** and you will see a Volumes Section which allows you to do the same thing.
 17. Click on **Next: Add Tags** and let's proceed

## Step 1.5: Add Tags

Tags are just used to find objects like instances, volumes etc. We add a single tag whose key is *name* and value is *node mongo production instance*
![Step 5: Add Tags](https://imgur.com/t429Vpu.png)
Click **Next: Configure Security Group** and let's proceed

## Step 1.6: Configure Security Group

 1. Security Groups are analogous to a Firewall with differences of course.
![Step 6: Configure Security Group](https://imgur.com/Nh3Krs7.png)
 4. By default, we only have SSH port 22 open here. We click **Add Rule** and select **HTTP** from the dropdown and similarly add another rule for **HTTPS**
 5. We will open more ports for Node and Mongo as required down the line. So keep this Tab in mind.
 6. Also, ignore  the warning. It is simply telling us that every single IP address can access these ports which is fine because they are after all Web Server ports, are they not?
 7. Feel free to add a description for each in the last column.
 8. Click **Review and Launch** when done to proceed

## Step 1.7: Review and Launch

 1. Made a mistake anywhere? Want to make changes? This is the screen where you can do so.
 2. Things are looking solid for us so lets click **Launch**

![Step 7: Review and Launch](https://imgur.com/6SSN3pH.png)
## Step 1.8: Create an SSH Key Pair
![Step 8: Create an SSH Key Pair](https://imgur.com/y1IKJIY.png)
 1. When you click **Launch** we are shown this modal which asks us to create a key pair.
 2. We can either use an existing key pair or create a new one from the dropdown.
 3. We will select **Create a new key pair** from the dropdown and download the private key file after giving it a name.
 4. **DO NOT LOSE THIS FILE and take a BACKUP of it IMMEDIATELY**
![Step 8: Create a new key pair](https://imgur.com/tdI7NUY.png)
 6. Right click on your Finder in OSX, click **Go to Folder**
 7. Type `~/.ssh` which opens the hidden ssh folder on your machine.
 8. Store this **node_mongo_prod_test.pem** file there.
 9. Click on **Launch Instances** on that modal window
![Step 8: Launch Instances](https://imgur.com/WMXflUm.png)
 10. You should see a screen like this. If you got errors, no worries, go to the bottom of the post where I have posted how to resolve them.
 11. Click on **View Instances**
![Step 8: View Instances](https://imgur.com/eVUWa0g.png)
 12. If you are looking at this screen, give yourself a BIG PAT on your back.
 13. **We have successfully installed Ubuntu 18.04 on EC2**

# Step 2: Connect to EC2 with SSH keys
 1. Open Terminal on OSX
 2. Type `ssh -i pem_file_location hostname` 
 3. If you are not familiar with how the SSH command is used, type `man ssh` which will show you the manual in the Terminal window of OSX
![EC2 SSH Modal](https://imgur.com/YaeAzWq.png)
 4. Run `ssh -i "~/.ssh/node_mongo_prod_test.pem" ubuntu@ec2-18-217-2-126.us-east-2.compute.amazonaws.com`

![SSH Permission Error](https://imgur.com/CNedvMV.png)
 1. You will get an error like this which is good. It is telling us that the SSH private key file can be read by anyone and we need to change the permission before connecting to EC2, 
 3. Run `chmod 400 ~/.ssh/node_mongo_prod_test.pem` on the OSX terminal to change permission. 
![SSH Connection Successful](https://imgur.com/YTJlBYk.png)
 4. **WONDERFUL**! Notice that command prompt changing to ubuntu@ip at the end? That is our instance into which we just logged in using SSH
 5. **To disconnect at any point, press Ctrl + D**
# Step 3: Update Ubuntu
 1. As per the most popular answer to update above, run
 8. `sudo apt-get update        # Fetches the list of available updates`
![sudo apt-get update](https://imgur.com/V7drjPc.png)
 10. `sudo apt-get upgrade       # Strictly upgrades the current packages`
![sudo apt get upgrade](https://imgur.com/lN1K1S2.png)
 11. The upgrade step will require a confirmation on your end, Press Y and you may also encounter a conflict in the menu package. You can read more about this issue [HERE](https://unix.stackexchange.com/questions/113732/a-new-version-of-configuration-file-etc-default-grub-is-available-but-the-vers) Report Broken Link
![Conflict in the menu package](https://imgur.com/Tr9Lq4X.png)
 12. `sudo apt-get dist-upgrade  # Installs updates (new ones)`
 13. At this stage, you want to restart your Ubuntu instance in order for the updates to take effect.
 14. You don't need the command prompt to restart. Do it from the Dashboard as shown below
![Restart Ubuntu Instance](https://imgur.com/rGmToKa.png)
 15. After rebooting, if you try running sudo apt-get update or sudo apt update again, you should be able to see that all packages are upto date. Also while rebooting you will get disconnected from EC2 so connect back like the first time we did.

# Step 4: Install Node.js using Node Version Manager

 1. We don't want to install a specific version of node.js
 2. We want the ability to switch between any version of node and even add/remove versions if needed.
 3. This is exactly why we are going to use [NVM](https://github.com/nvm-sh/nvm) Report Broken Link
 4. First, let's check if node or nvm are available on our Ubuntu instance.
![Node and NVm are not available](https://imgur.com/zS8rDAD.png)
 5. Type `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash`
 6. Notice the version number in the url, if you want a newer version, check the [NVM repo](https://github.com/nvm-sh/nvm) Report Broken Link
![NVM install](https://imgur.com/wD3PPx5.png)
 7. Notice that even after installing, NVM command is not found. This is because we need to run one more command to activate it.
 8. Type `source ~/.bashrc`
 9. Now, if you type nvm, you should be able to see the various options under that command.
![NVM install complete](https://imgur.com/O4jdbCR.png) 
 10. Type the command, `nvm ls-remote` which gives you the list of Node versions that you can install.
![nvm ls-remote](https://imgur.com/2yi3MAf.png)
 11. To install the latest version 10.16.0 at the time of this post, type `nvm install 10.16.0`
![nvm install 10.16.0](https://imgur.com/XQFMRCR.png)
 12. Wonderful! not only is the installation successful but the node command also starts working and node --version shows 10.16.0. **Node.js installation complete!**

# Resources
 1. [Windows Putty SSH Connection to EC2: Stackoverflow](https://stackoverflow.com/questions/10287337/ssh-to-amazon-ec2-instance-using-putty-in-windows) Report Broken Link
 2.  [EC2 AMI recommendations: Serverfault](https://serverfault.com/questions/197927/amazon-ec2-ami-recommendations-for-free-tier) Report Broken Link
 3. [Amazon Linux vs Ubuntu: Serverfault](https://serverfault.com/questions/275736/amazon-linux-vs-ubuntu-for-amazon-ec2) Report Broken Link
 4. [MongoDB working with EC2 Documentation: MongoDB Docs](https://docs.mongodb.com/ecosystem/platforms/amazon-ec2/) Report Broken Link
 5. [Amazon Free Tier FAQ: AWS Docs](https://aws.amazon.com/free/free-tier-faqs/) Report Broken Link.
 6. [AWS VPC Limits: AWS Docs](https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html) Report Broken Link.
 7. [EC2 Dashboard Terminology Explained: Hackernoon](https://hackernoon.com/understanding-amazon-ec2-terminology-85be19d0af28) Report Broken Link
 8. [Should MongoDB run on its own EC2 instance: Stackoverflow](https://stackoverflow.com/questions/8742240/should-i-be-running-mongodb-on-its-own-ec2-instance) Report Broken Link
 9. [x86 vs ARM processors EC2: Google Search](https://lmgtfy.com/?q=ec2%20x86%20vs%20arm) Report Broken Link
 10. [t2.micro specs and Pricing: Google Search](https://lmgtfy.com/?q=ec2%20t2%20micro%20specs) Report Broken Link
 11. [Are Amazon's Micro instances good for MongoDB servers: Stackoverflow](https://stackoverflow.com/questions/5287882/are-amazons-micro-instances-linux-64bit-good-for-mongodb-servers) Report Broken Link 
 12. [Types of EBS Volumes: AWS Docs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EBSVolumeTypes.html) Report Broken Link 
 13. [Separate data, logs and journal into different storage devices: MongoDB Docs](https://docs.mongodb.com/manual/administration/production-notes/#separate-components-onto-different-storage-devices) Report Broken Link
 14. [MongoDB, should I separate journal and data to different drives: DBA Stackexchange](https://dba.stackexchange.com/questions/33669/mongodb-should-i-separate-the-journal-and-the-data-to-different-drives) Report Broken Link
 15. [Difference between stopping and terminating an EC2 instance: Rightscale](https://docs.rightscale.com/faq/clouds/aws/Whats_the_difference_between_Terminating_and_Stopping_an_EC2_Instance.html) Report Broken Link
 16. [Do you get charged for a stopped instance on EC2: Stackoverflow](https://stackoverflow.com/questions/2549035/do-you-get-charged-for-a-stopped-instance-on-ec2/10419883#10419883) Report Broken Link
 17. [Do we need both security groups and server side firewall in EC2: Serverfault](https://serverfault.com/questions/899278/do-we-need-both-security-groups-and-server-side-firewall-in-aws-ec2) Report Broken Link
 18. [Why have both Security Groups and IPTables on EC2: Serverfault](https://serverfault.com/questions/286665/why-have-both-security-groups-and-iptables-on-amazon-ec2)  Report Broken Link.
 19. [Where do I keep my Amazon PEM files on OSX: Stackoverflow](https://stackoverflow.com/questions/25626592/where-do-i-keep-my-amazon-pem-file-on-a-mac) Report Broken Link
 20. [0644 directory permission explained: FilePermissions](http://www.filepermissions.com/directory-permission/0644) Report Broken Link
 21. [How to install Ubuntu updates via command line: AskUbuntu](https://askubuntu.com/questions/196768/how-to-install-updates-via-command-line/196777#196777) Report Broken Link
<!--stackedit_data:
eyJoaXN0b3J5IjpbMTk5NDYwMjM0MSwxMzIwMDUzNjYsLTYwNT
I5ODg5LC0yMDEzMDQyMTUyLDIwOTU2MTc0OTEsLTEzMjI1Nzkw
NTEsLTE2OTQzMDIwMzIsLTEyNjE4MTQ0MTQsMTIzNzMyODk3OS
wtODcwNzYwNjM5LC00NDIzMTMxNjgsNzQ1MTA5OTc2LC05ODY3
MjI4NDYsLTE5ODIwNDc1ODUsMTY2ODg3ODg0MCwzMzEzMTcwOD
UsLTE1NTU3NzcwMjYsLTY5NjUyMzI2NCwtNzgzMTAyMTg0LC0x
ODYzOTUxODU3XX0=
-->