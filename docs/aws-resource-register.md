# AWS Resource Register – ShopSmart (Individual)

- AWS account plan: Free plan. Credits: US$120.00 available (US$100 sign-up + US$20 for creating a budget), US$0.00 used on Nov 20, 2026; credits expire Nov 19, 2027, but the Free plan ends after 6 months (about May 21, 2027) or when credits run out
- Region: ap-southeast-1 (Singapore)
- Owner: Jansdale S. Yusi
- Demo dates: Nov 20, 2026 – until graded
- Planned removal: after the grade is released (latest: December 15, 2026). Order: terminate instance → release Elastic IP → delete security group → delete key pair → check Billing → Credits

| Service | Resource name | Region | Owner | Purpose | Created | Planned removal |
|---|---|---|---|---|---|---|
| AWS account | jansdale-shopsmart | global | Jansdale | Hosting for the ShopSmart demo | 2026-11-20 | Close after grading |
| AWS Budgets | My Zero-Spend Budget | global | Jansdale | Spending alert | 2026-11-20 | Keep until account closes |
| EC2 instance | shopsmart-web (i-0d4ed26d92c436c16), t3.small, Ubuntu 24.04 | ap-southeast-1 (ap-southeast-1c) | Jansdale | Runs Caddy (HTTPS + React build), Express API (systemd) and PostgreSQL 16 | 2026-11-20 | Terminate after grading |
| EBS volume | 20 GiB gp3 root volume of shopsmart-web | ap-southeast-1 (ap-southeast-1c) | Jansdale | Server disk (code, database files) | 2026-11-20 | Deleted with the instance |
| Elastic IP | 13.250.195.24 | ap-southeast-1 | Jansdale | Fixed public address; site hostname 13-250-195-24.sslip.io | 2026-11-20 | Release right after terminating the instance |
| Security group | shopsmart-web-sg (sg-0fd88e55ce5c74853) | ap-southeast-1 | Jansdale | Inbound 22 (my IP only), 80, 443; ports 3000 and 5432 not opened | 2026-11-20 | Delete after the instance |
| EC2 key pair | shopsmart-key (ED25519; private key kept only on my laptop) | ap-southeast-1 | Jansdale | SSH login to the server | 2026-11-20 | Delete after the instance; delete the .pem file |

No passwords, keys or connection strings are recorded in this file.