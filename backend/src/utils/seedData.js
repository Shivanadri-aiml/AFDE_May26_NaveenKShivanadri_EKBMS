require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const {
  sequelize,
  Role,
  User,
  Category,
  Tag,
  Article,
  ArticleTag,
  Comment,
  Rating,
  Bookmark,
} = require('../models');

const seed = async () => {
  try {
    console.log('Syncing database (force: true — all data will be reset)...');
    await sequelize.sync({ force: true });
    console.log('Database synced.');

    // ─── ROLES ───────────────────────────────────────────────────────────────
    console.log('Creating roles...');
    const [adminRole, authorRole, reviewerRole, employeeRole] = await Promise.all([
      Role.create({ name: 'Admin', description: 'Full system access and management' }),
      Role.create({ name: 'Author', description: 'Can create and manage own articles' }),
      Role.create({ name: 'Reviewer', description: 'Can review and approve/reject articles' }),
      Role.create({ name: 'Employee', description: 'Read-only access to approved articles' }),
    ]);
    console.log('Roles created:', adminRole.name, authorRole.name, reviewerRole.name, employeeRole.name);

    // ─── USERS ───────────────────────────────────────────────────────────────
    console.log('Creating users...');
    // Pass plaintext passwords — the beforeCreate hook hashes them automatically
    const adminUser = await User.create({ name: 'System Admin', email: 'admin@kb.com', password: 'Admin@123', roleId: adminRole.id, isActive: true });
    const authorUser = await User.create({ name: 'John Author', email: 'author@kb.com', password: 'Author@123', roleId: authorRole.id, isActive: true });
    const reviewerUser = await User.create({ name: 'Mary Reviewer', email: 'reviewer@kb.com', password: 'Review@123', roleId: reviewerRole.id, isActive: true });
    const employeeUser = await User.create({ name: 'John Doe', email: 'john.doe@kb.com', password: 'User@1234', roleId: employeeRole.id, isActive: true });

    console.log('Users created:', adminUser.email, authorUser.email, reviewerUser.email, employeeUser.email);

    // ─── CATEGORIES ──────────────────────────────────────────────────────────
    console.log('Creating categories...');
    const [hrCat, itCat, infraCat, trainingCat, financeCat, operationsCat] = await Promise.all([
      Category.create({ name: 'HR Policies', description: 'Human resources policies and procedures', createdBy: adminUser.id }),
      Category.create({ name: 'IT Support', description: 'IT helpdesk and support documentation', createdBy: adminUser.id }),
      Category.create({ name: 'Infrastructure', description: 'Network and cloud infrastructure guides', createdBy: adminUser.id }),
      Category.create({ name: 'Training Materials', description: 'Employee training and onboarding resources', createdBy: adminUser.id }),
      Category.create({ name: 'Finance', description: 'Finance processes, reimbursements and reporting', createdBy: adminUser.id }),
      Category.create({ name: 'Operations', description: 'Operational SOPs and best practices', createdBy: adminUser.id }),
    ]);
    console.log('Categories created.');

    // ─── TAGS ─────────────────────────────────────────────────────────────────
    console.log('Creating tags...');
    const [tagGettingStarted, tagTroubleshooting, tagPolicy, tagBestPractices, tagSecurity, tagOnboarding, tagSop, tagFaq] =
      await Promise.all([
        Tag.create({ name: 'getting-started' }),
        Tag.create({ name: 'troubleshooting' }),
        Tag.create({ name: 'policy' }),
        Tag.create({ name: 'best-practices' }),
        Tag.create({ name: 'security' }),
        Tag.create({ name: 'onboarding' }),
        Tag.create({ name: 'sop' }),
        Tag.create({ name: 'faq' }),
      ]);
    console.log('Tags created.');

    // ─── ARTICLES ─────────────────────────────────────────────────────────────
    console.log('Creating articles...');
    const now = new Date();

    // 1. Employee Onboarding Guide — Approved
    const article1 = await Article.create({
      title: 'Employee Onboarding Guide',
      content: `## Welcome to the Company!

This guide will help new employees get started quickly and smoothly.

### Day 1 Checklist
- Complete HR paperwork and sign the employment contract
- Obtain your employee ID badge and access cards
- Set up your workstation and company email account
- Meet with your manager for an orientation session
- Complete mandatory compliance training modules

### IT Setup
1. Log into your company laptop using your email credentials
2. Connect to the corporate VPN (see VPN Setup Guide)
3. Install required software from the Software Center
4. Set up MFA (Multi-Factor Authentication) for all accounts

### Company Policies
All employees must review and acknowledge:
- Code of Conduct
- Data Protection Policy
- Acceptable Use Policy
- Leave and Attendance Policy

### Key Contacts
- HR Department: hr@company.com
- IT Helpdesk: support@company.com
- Facilities: facilities@company.com

### First Week Goals
Complete your department-specific orientation, meet your team members, and shadow your buddy for the first three days.`,
      description: 'A comprehensive guide to help new employees get started on day one.',
      categoryId: trainingCat.id,
      authorId: authorUser.id,
      reviewerId: reviewerUser.id,
      status: 'Approved',
      publishedAt: now,
      reviewedAt: now,
      viewCount: 245,
      approvalComment: 'Excellent onboarding guide, approved for all employees.',
    });
    await article1.setTags([tagGettingStarted, tagOnboarding]);

    // 2. IT Security Policy — Approved
    const article2 = await Article.create({
      title: 'IT Security Policy',
      content: `## IT Security Policy

This policy outlines the security standards all employees must follow when using company IT resources.

### Password Requirements
- Minimum 12 characters
- Must include uppercase, lowercase, numbers, and special characters
- Must be changed every 90 days
- Cannot reuse last 10 passwords
- Never share passwords with anyone, including IT staff

### Device Security
- Lock your screen whenever leaving your desk (Win+L / Cmd+Ctrl+Q)
- Do not connect unauthorized USB devices
- Report lost or stolen devices immediately to IT
- Keep devices physically secure

### Email and Phishing
- Do not click on suspicious links
- Verify sender identity before opening attachments
- Report phishing emails using the "Report Phishing" button
- Never send sensitive data via unencrypted email

### Data Classification
| Level | Description | Example |
|-------|-------------|---------|
| Public | Freely shareable | Marketing materials |
| Internal | For employees only | Internal memos |
| Confidential | Limited distribution | Financial reports |
| Restricted | Strictly controlled | Customer PII |

### Incident Reporting
Report security incidents within 1 hour of discovery to security@company.com or call the security hotline.

### Violations
Non-compliance may result in disciplinary action up to and including termination.`,
      description: 'Mandatory IT security policy covering passwords, devices, and data handling.',
      categoryId: itCat.id,
      authorId: authorUser.id,
      reviewerId: reviewerUser.id,
      status: 'Approved',
      publishedAt: now,
      reviewedAt: now,
      viewCount: 312,
      approvalComment: 'Policy is up to date and approved.',
    });
    await article2.setTags([tagPolicy, tagSecurity, tagBestPractices]);

    // 3. VPN Setup Guide — Approved
    const article3 = await Article.create({
      title: 'VPN Setup Guide',
      content: `## Corporate VPN Setup Guide

This guide explains how to connect to the corporate VPN from outside the office.

### Prerequisites
- Company-issued laptop or approved personal device
- VPN client installed (Cisco AnyConnect or GlobalProtect)
- Your employee credentials
- MFA app installed on your smartphone

### Installation
#### Windows
1. Download the VPN client from the Software Center
2. Run the installer and follow the prompts
3. Accept the license agreement
4. Complete the installation and restart if prompted

#### macOS
1. Go to Software Center in Self Service
2. Find "VPN Client" and click Install
3. Grant system extension permissions when prompted
4. Open System Preferences > Security & Privacy to allow the extension

### Connecting
1. Open the VPN client application
2. Enter the server address: vpn.company.com
3. Enter your company email and password
4. Enter the MFA code from your authenticator app
5. Click Connect

### Troubleshooting
**Connection Timeout**
- Check your internet connection
- Try a different network (mobile hotspot)
- Ensure the server address is correct

**Authentication Failed**
- Verify your credentials are correct
- Check your MFA code hasn't expired
- Contact IT if the issue persists

**Slow Connection**
- Disconnect and reconnect to get a faster server
- Close bandwidth-heavy applications
- Use split tunneling if enabled by your admin

### Support
Contact IT Helpdesk at support@company.com or extension 1234.`,
      description: 'Step-by-step guide to set up and use the corporate VPN on Windows and macOS.',
      categoryId: itCat.id,
      authorId: authorUser.id,
      reviewerId: reviewerUser.id,
      status: 'Approved',
      publishedAt: now,
      reviewedAt: now,
      viewCount: 189,
      approvalComment: 'Accurate and well-written.',
    });
    await article3.setTags([tagGettingStarted, tagTroubleshooting]);

    // 4. HR Leave Policy — Approved
    const article4 = await Article.create({
      title: 'HR Leave Policy',
      content: `## Leave Policy

This document outlines the types of leave available to all full-time employees.

### Annual Leave
- Employees accrue 1.5 days of annual leave per month (18 days per year)
- Unused leave can be carried over up to 10 days to the next year
- Leave requests must be submitted at least 5 business days in advance
- Manager approval is required for all annual leave

### Sick Leave
- 10 days of paid sick leave per year
- A medical certificate is required for absences of 3 or more consecutive days
- Sick leave does not carry over to the next year

### Maternity / Paternity Leave
- Maternity leave: 16 weeks paid
- Paternity leave: 2 weeks paid
- Adoption leave: equivalent to maternity leave for the primary caregiver

### Public Holidays
The company observes all national public holidays. A list of holidays is published on the HR portal each January.

### Emergency Leave
- Up to 3 days of emergency leave per year for unexpected personal circumstances
- Supporting documentation may be required

### How to Apply for Leave
1. Log in to the HR Self-Service Portal at hr.company.com
2. Navigate to "Leave Management"
3. Select the leave type and dates
4. Add any relevant comments or attachments
5. Submit for manager approval
6. You will receive an email confirmation once approved

### Contact
For any leave-related queries, contact hr@company.com.`,
      description: 'Official HR leave policy including annual leave, sick leave, and parental leave entitlements.',
      categoryId: hrCat.id,
      authorId: authorUser.id,
      reviewerId: reviewerUser.id,
      status: 'Approved',
      publishedAt: now,
      reviewedAt: now,
      viewCount: 401,
      approvalComment: 'Policy reviewed and approved by HR Director.',
    });
    await article4.setTags([tagPolicy, tagOnboarding]);

    // 5. Network Troubleshooting SOP — Pending Approval
    const article5 = await Article.create({
      title: 'Network Troubleshooting SOP',
      content: `## Network Troubleshooting Standard Operating Procedure

This SOP provides a structured approach for diagnosing and resolving common network issues.

### Scope
Applicable to all IT support staff handling Level 1 and Level 2 network incidents.

### Step 1: Identify the Problem
- Determine whether the issue affects one user, a group, or the entire office
- Check the IT status page at status.company.com for known outages
- Ask the user: when did the issue start? What changed recently?

### Step 2: Basic Diagnostics
Run the following commands:
\`\`\`bash
# Check connectivity
ping 8.8.8.8

# Trace the network path
traceroute google.com  # macOS/Linux
tracert google.com     # Windows

# Check DNS resolution
nslookup company.com

# Check active connections
netstat -an | grep ESTABLISHED
\`\`\`

### Step 3: Physical Layer Checks
- Verify all cables are firmly connected
- Check indicator lights on switches and routers
- Try a different Ethernet cable or port
- Restart the network adapter (disable/enable)

### Step 4: Escalation Criteria
Escalate to Level 3 if:
- Issue affects more than 10 users
- Core infrastructure devices are unresponsive
- Issue has persisted for more than 2 hours
- Data loss is suspected

### Step 5: Documentation
- Log all troubleshooting steps in the ticketing system
- Record time to resolution
- Update the known issues database if applicable

### Contact
Network Operations Center: noc@company.com | 24/7 Hotline: +1-800-NET-HELP`,
      description: 'Standard operating procedure for diagnosing and resolving network connectivity issues.',
      categoryId: infraCat.id,
      authorId: authorUser.id,
      status: 'Pending Approval',
      viewCount: 12,
    });
    await article5.setTags([tagTroubleshooting, tagSop]);

    // 6. Cloud Infrastructure Guide — Draft
    const article6 = await Article.create({
      title: 'Cloud Infrastructure Guide',
      content: `## Cloud Infrastructure Guide (DRAFT)

This guide covers the company's cloud infrastructure architecture and best practices.

### Cloud Providers
We use the following cloud providers:
- **AWS** — Primary cloud for production workloads
- **Azure** — Secondary cloud for Office 365 and backup
- **GCP** — Machine learning and data analytics workloads

### AWS Environment Structure
\`\`\`
Production Account
├── VPC: 10.0.0.0/16
│   ├── Public Subnets (AZ-a, AZ-b, AZ-c)
│   ├── Private Subnets (AZ-a, AZ-b, AZ-c)
│   └── Database Subnets (AZ-a, AZ-b, AZ-c)
└── Services: ECS, RDS, ElastiCache, S3, CloudFront

Staging Account
└── (mirror of production, scaled down)
\`\`\`

### Access Management
All access is managed via AWS IAM with:
- Role-based access control (RBAC)
- MFA enforced for all human users
- Service accounts use IAM roles, never long-lived access keys

### Deployment Process
[To be completed]

### Monitoring and Alerting
[To be completed]`,
      description: 'Overview of cloud infrastructure architecture, access management, and deployment processes.',
      categoryId: infraCat.id,
      authorId: authorUser.id,
      status: 'Draft',
      viewCount: 3,
    });
    await article6.setTags([tagBestPractices, tagSecurity]);

    // 7. Finance Reimbursement Process — Rejected
    const article7 = await Article.create({
      title: 'Finance Reimbursement Process',
      content: `## Expense Reimbursement Process

This document explains how to submit expense reimbursement claims.

### Eligible Expenses
- Business travel (flights, hotels, ground transport)
- Client entertainment (pre-approved only)
- Office supplies purchased for work purposes
- Professional development (courses, books, conferences)

### Submission Process
1. Collect all receipts for business expenses
2. Log into the Finance Portal at finance.company.com
3. Navigate to "Expense Claims" > "New Claim"
4. Enter expense details and upload scanned receipts
5. Select the appropriate cost center
6. Submit for manager approval

### Reimbursement Timeline
- Claims submitted by the 15th of the month are processed by month end
- Claims submitted after the 15th are processed in the following month
- Payment is made via direct deposit to your registered bank account

### Limits
| Expense Type | Limit |
|---|---|
| Meals per day | $75 |
| Hotel per night | $200 |
| Flights | Actual cost, economy class only |

### Rejected Claims
Claims will be rejected without valid receipts or if they exceed policy limits.`,
      description: 'Guide to submitting employee expense reimbursement claims through the finance portal.',
      categoryId: financeCat.id,
      authorId: authorUser.id,
      reviewerId: reviewerUser.id,
      status: 'Rejected',
      reviewedAt: now,
      viewCount: 8,
      approvalComment: 'Expense limits are outdated. Please update meal allowance to $100/day and hotel to $250/night before resubmitting.',
    });
    await article7.setTags([tagPolicy, tagSop]);

    // 8. New Employee FAQ — Approved
    const article8 = await Article.create({
      title: 'New Employee FAQ',
      content: `## Frequently Asked Questions — New Employees

A curated list of the most common questions asked by new joiners.

---

**Q: When will I receive my employee ID?**
A: Your employee ID will be provided on your first day along with your access badge. The format is EMP-XXXXX.

---

**Q: How do I set up my company email?**
A: IT will send setup instructions to your personal email before your start date. Follow the link to activate your account and set up MFA.

---

**Q: What are the office working hours?**
A: Core hours are 10:00 AM – 4:00 PM. Outside of core hours you have flexibility, with manager agreement. Remote work is available up to 3 days per week.

---

**Q: Who do I contact if I have IT issues?**
A: Contact the IT Helpdesk at support@company.com, call extension 1234, or submit a ticket at help.company.com.

---

**Q: How do I apply for leave?**
A: Use the HR Self-Service Portal at hr.company.com. See the HR Leave Policy for details on entitlements.

---

**Q: Where can I find the company org chart?**
A: The org chart is available on the company intranet at intranet.company.com > About Us > Our Team.

---

**Q: How do I claim expenses?**
A: Submit expense claims via the Finance Portal at finance.company.com. Keep all original receipts.

---

**Q: What training do I need to complete?**
A: Within your first two weeks, complete: Compliance Training, Data Protection, Security Awareness, and Code of Conduct modules. All are available on the Learning Management System at lms.company.com.

---

**Q: Is there a probation period?**
A: Yes, there is a 3-month probation period for all new employees. Your manager will conduct a formal review at the end of your probation.

---

**Q: Who is my buddy/mentor?**
A: HR will assign you an onboarding buddy from your team. They will reach out before your start date.`,
      description: 'Answers to the most common questions from new employees.',
      categoryId: trainingCat.id,
      authorId: authorUser.id,
      reviewerId: reviewerUser.id,
      status: 'Approved',
      publishedAt: now,
      reviewedAt: now,
      viewCount: 523,
      approvalComment: 'Comprehensive and accurate FAQ, approved.',
    });
    await article8.setTags([tagFaq, tagOnboarding, tagGettingStarted]);

    console.log('Articles created (8 total).');

    // ─── COMMENTS ────────────────────────────────────────────────────────────
    console.log('Creating sample comments...');
    await Promise.all([
      Comment.create({ articleId: article1.id, userId: employeeUser.id, content: 'Very helpful guide, covered everything I needed for day one!' }),
      Comment.create({ articleId: article1.id, userId: adminUser.id, content: 'Great resource. Consider adding a section about parking and cafeteria access.' }),
      Comment.create({ articleId: article2.id, userId: employeeUser.id, content: 'Clear and concise. The data classification table is very useful.' }),
      Comment.create({ articleId: article4.id, userId: employeeUser.id, content: 'Thanks! I had a question about carrying over leave — this answered it perfectly.' }),
      Comment.create({ articleId: article8.id, userId: employeeUser.id, content: 'Exactly what I was looking for. Answered all my first-day questions.' }),
      Comment.create({ articleId: article3.id, userId: employeeUser.id, content: 'The macOS instructions worked perfectly for me. Thanks!' }),
    ]);
    console.log('Comments created.');

    // ─── RATINGS ─────────────────────────────────────────────────────────────
    console.log('Creating sample ratings...');
    await Promise.all([
      Rating.create({ articleId: article1.id, userId: employeeUser.id, rating: 5 }),
      Rating.create({ articleId: article1.id, userId: adminUser.id, rating: 4 }),
      Rating.create({ articleId: article2.id, userId: employeeUser.id, rating: 5 }),
      Rating.create({ articleId: article2.id, userId: adminUser.id, rating: 5 }),
      Rating.create({ articleId: article3.id, userId: employeeUser.id, rating: 4 }),
      Rating.create({ articleId: article4.id, userId: employeeUser.id, rating: 5 }),
      Rating.create({ articleId: article4.id, userId: adminUser.id, rating: 4 }),
      Rating.create({ articleId: article8.id, userId: employeeUser.id, rating: 5 }),
      Rating.create({ articleId: article8.id, userId: adminUser.id, rating: 5 }),
    ]);
    console.log('Ratings created.');

    // ─── BOOKMARKS ───────────────────────────────────────────────────────────
    console.log('Creating sample bookmarks...');
    await Promise.all([
      Bookmark.create({ articleId: article1.id, userId: employeeUser.id }),
      Bookmark.create({ articleId: article2.id, userId: employeeUser.id }),
      Bookmark.create({ articleId: article4.id, userId: employeeUser.id }),
      Bookmark.create({ articleId: article8.id, userId: employeeUser.id }),
      Bookmark.create({ articleId: article1.id, userId: adminUser.id }),
      Bookmark.create({ articleId: article3.id, userId: authorUser.id }),
    ]);
    console.log('Bookmarks created.');

    // ─── SUMMARY ─────────────────────────────────────────────────────────────
    console.log('\n===========================================');
    console.log('  DATABASE SEEDED SUCCESSFULLY');
    console.log('===========================================');
    console.log('\nLogin Credentials:');
    console.log('------------------------------------------');
    console.log('  Admin:    admin@kb.com    / Admin@123');
    console.log('  Author:   author@kb.com   / Author@123');
    console.log('  Reviewer: reviewer@kb.com / Review@123');
    console.log('  Employee: john.doe@kb.com / User@1234');
    console.log('------------------------------------------');
    console.log('\nSeed Summary:');
    console.log('  Roles:      4');
    console.log('  Users:      4');
    console.log('  Categories: 6');
    console.log('  Tags:       8');
    console.log('  Articles:   8 (4 Approved, 1 Pending, 1 Draft, 1 Rejected)');
    console.log('  Comments:   6');
    console.log('  Ratings:    9');
    console.log('  Bookmarks:  6');
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
