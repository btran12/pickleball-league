# PicklePal - CloudFormation Backend Infrastructure

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS Cloud Infrastructure                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────┐     ┌──────────────┐     ┌────────────────────────┐   │
│  │  Route53  │────▶│  CloudFront  │────▶│  S3 (Frontend Hosting) │   │
│  │ (Domain)  │     │    (CDN)     │     └────────────────────────┘   │
│  └──────────┘     └──────┬───────┘                                    │
│                           │                                           │
│                    ┌──────▼───────┐                                   │
│                    │ API Gateway  │◀──── /api/* routes                │
│                    │  (REST API)  │                                   │
│                    └──────┬───────┘                                   │
│                           │                                           │
│         ┌─────────────────┼─────────────────┐                        │
│         │                 │                 │                         │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐                 │
│  │   Lambda    │  │   Lambda    │  │   Lambda    │                 │
│  │ API Handler │  │  Confirm    │  │  Auto-      │                 │
│  │             │  │  Score      │  │  Confirm    │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                 │                 │                         │
│  ┌──────▼─────────────────▼─────────────────▼──────┐                │
│  │                  DynamoDB Tables                  │                │
│  │  • teams  • players  • matchups  • games         │                │
│  │  • tokens • audit    • seasons                    │                │
│  └──────────────────────────────────────────────────┘                │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │   Cognito    │  │     SES      │  │       EventBridge        │   │
│  │  (Auth)      │  │   (Email)    │  │  • Auto-confirm timer    │   │
│  │              │  │              │  │  • Weekly reminders       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
│                                                                       │
│  ┌──────────────┐  ┌──────────────────────────────────────────────┐  │
│  │     SNS      │  │              CloudWatch                       │  │
│  │  (SMS/Push)  │  │  • Lambda error alarms                       │  │
│  │              │  │  • API latency monitoring                    │  │
│  └──────────────┘  │  • Log groups (14-90 day retention)          │  │
│                     └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Resources Created

### Compute
| Resource | Description |
|----------|-------------|
| **Lambda: API Handler** | Main application logic for CRUD operations |
| **Lambda: Confirm Score** | Handles token-based score confirmation |
| **Lambda: Auto Confirm** | Periodic check for expired confirmation tokens |
| **Lambda: Weekly Reminder** | Sends match reminders via email/SMS |

### Database (DynamoDB)
| Table | Key | GSIs | Purpose |
|-------|-----|------|---------|
| `teams` | `id` (HASH) | — | Team records |
| `players` | `id` (HASH) | `teamId` + `rating` | Player records, team lookups |
| `matchups` | `id` (HASH) | `weekNumber`, `status` | Match schedules & scores |
| `games` | `id` (HASH) | `matchupId` | Individual game scores |
| `tokens` | `token` (HASH) | `matchupId`, `expiresAt` | Confirmation tokens (TTL) |
| `audit` | `id` (HASH) | `timestamp` | Audit log (TTL) |
| `seasons` | `id` (HASH) | — | Season configuration |

### API Gateway
- REST API with proxy integration to Lambda
- Cognito authorizer for admin endpoints
- Usage plan with rate limiting (50 req/s, burst 100)
- CORS enabled

### Authentication (Cognito)
- User Pool with email-based admin accounts
- Identity Pool for federated access
- Password policy: 8+ chars, uppercase, numbers required
- Temporary password validity: 7 days

### Frontend Hosting
- **S3**: Static file hosting with versioning
- **CloudFront**: CDN with OAI, HTTP/2+3, TLS 1.2+
- SPA routing via custom error responses (403/404 → index.html)
- API proxy via `/api/*` cache behavior

### Notifications
- **SES**: Email confirmations and reminders
- **SNS**: SMS notifications (via phone number subscription)
- **EventBridge**: Scheduled triggers for auto-confirm and reminders

### Monitoring
- CloudWatch Alarms for Lambda errors and API latency
- Log groups with environment-based retention (14 days dev, 90 days prod)

## Quick Start

### Prerequisites
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Install jq
sudo apt-get install jq  # or brew install jq

# Configure AWS credentials
aws configure
```

### Deploy

```bash
# Development environment
chmod +x deploy.sh
./deploy.sh dev your-email@example.com

# Production with custom domain
./deploy.sh prod admin@picklepal.com \
  --domain picklepal.example.com \
  --zone Z1234567890ABC \
  --phone +15551234567

# Staging with SMS notifications
./deploy.sh staging admin@picklepal.com --phone +15551234567
```

### Manual Deployment (without script)

```bash
# 1. Create the stack
aws cloudformation create-stack \
  --stack-name picklepal-dev \
  --template-body file://cloudformation/backend.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=picklepal \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=AdminEmail,ParameterValue=your-email@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# 2. Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name picklepal-dev \
  --region us-east-1

# 3. Get outputs
aws cloudformation describe-stacks \
  --stack-name picklepal-dev \
  --query 'Stacks[0].Outputs' \
  --output json

# 4. Deploy frontend
aws s3 sync dist/ s3://picklepal-dev-frontend-ACCOUNTID --delete
aws cloudfront create-invalidation \
  --distribution-id DIST_ID \
  --paths "/*"
```

## Parameters Reference

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `ProjectName` | No | `picklepal` | Resource name prefix |
| `Environment` | No | `prod` | `dev`, `staging`, or `prod` |
| `AdminEmail` | **Yes** | — | Initial admin user email |
| `AdminPhone` | No | — | Phone for SMS (E.164 format) |
| `DomainName` | No | — | Custom domain (e.g., `app.example.com`) |
| `HostedZoneId` | No | — | Route53 zone for DNS validation |
| `LambdaMemorySize` | No | `256` | MB allocation for Lambda |
| `AutoConfirmHours` | No | `48` | Hours before auto-confirm |
| `CorsOrigin` | No | `*` | CORS allowed origin |

## API Endpoints

After deployment, the API is available at:

```
https://{api-id}.execute-api.{region}.amazonaws.com/{env}/
```

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/teams` | None | List/Create teams |
| GET/PUT/DELETE | `/teams/{id}` | None | Team CRUD |
| GET/POST | `/players` | None | List/Create players |
| GET/PUT/DELETE | `/players/{id}` | None | Player CRUD |
| GET/POST | `/matchups` | None | List/Create matchups |
| GET/PUT | `/matchups/{id}` | None | Matchup details |
| POST | `/matchups/{id}/scores` | None | Submit scores |
| GET | `/confirm/{token}` | None | View submitted scores |
| POST | `/confirm/{token}` | None | Confirm/Dispute scores |
| GET | `/rankings` | None | Team & player rankings |
| ANY | `/admin/*` | Cognito | Admin operations |

## Score Confirmation Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  Player   │────▶│  Submit      │────▶│  Generate    │────▶│  Send    │
│  enters   │     │  Scores      │     │  Token       │     │  Link    │
│  scores   │     │  (Lambda)    │     │  (DynamoDB)  │     │  (SES)   │
└──────────┘     └──────────────┘     └──────────────┘     └────┬─────┘
                                                                 │
                    ┌──────────────┐     ┌──────────────┐        │
                    │  Lock        │◀────│  Opponent    │◀───────┘
                    │  Scores      │     │  Clicks Link │
                    │  (DynamoDB)  │     │  & Confirms  │
                    └──────────────┘     └──────────────┘
                           │
                    ┌──────▼───────┐
                    │  Update      │
                    │  Standings   │
                    │  & Ratings   │
                    └──────────────┘

  ⏰ Auto-confirm after {AutoConfirmHours} if no response
```

## Lambda Function Code

The CloudFormation template includes placeholder Lambda code. For production, replace with actual implementation:

### Option 1: SAM (Recommended for development)

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/api/
      Handler: index.handler
      Runtime: nodejs20.x
      Events:
        Api:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
```

```bash
sam build && sam deploy --guided
```

### Option 2: Direct deployment

```bash
# Package Lambda code
cd src/api
zip -r ../../lambda/api-handler.zip .

# Update function code
aws lambda update-function-code \
  --function-name picklepal-dev-api-handler \
  --zip-file fileb://lambda/api-handler.zip
```

### Option 3: CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci && npm run build
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: ./deploy.sh prod ${{ secrets.ADMIN_EMAIL }}
```

## Cost Estimate

| Service | Monthly Cost (dev) | Monthly Cost (prod) |
|---------|-------------------|---------------------|
| DynamoDB | ~$0.50 (on-demand) | ~$2-5 |
| Lambda | ~$0 (free tier) | ~$5-10 |
| API Gateway | ~$3.50 | ~$10-20 |
| CloudFront | ~$0.50 | ~$5-15 |
| S3 | ~$0.05 | ~$0.50 |
| Cognito | ~$0 (free tier) | ~$5 |
| SES | ~$0 (free tier) | ~$1-5 |
| SNS | ~$0.05 | ~$1-3 |
| EventBridge | ~$0.50 | ~$1 |
| CloudWatch | ~$0.50 | ~$3-5 |
| **Total** | **~$5-6** | **~$35-65** |

*Estimates based on moderate usage (~1000 API calls/day, 50 players)*

## Cleanup

```bash
# Delete the stack (removes all resources)
aws cloudformation delete-stack --stack-name picklepal-dev --region us-east-1

# Empty S3 bucket first if needed
aws s3 rm s3://picklepal-dev-frontend-ACCOUNTID --recursive

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name picklepal-dev --region us-east-1
```

## Security Notes

1. **Cognito**: Admin-only user pool; players authenticate via tokenized links (no accounts needed)
2. **DynamoDB**: Point-in-time recovery enabled in production
3. **S3**: Public access blocked; only accessible via CloudFront OAI
4. **CloudFront**: TLS 1.2+ enforced; HSTS recommended
5. **API Gateway**: Rate limiting enabled; admin endpoints require Cognito auth
6. **Lambda**: Runs in AWS-managed VPC; no direct internet access needed
7. **Secrets**: No secrets in template; use AWS Secrets Manager for production keys

## Environment Variables (Lambda)

| Variable | Source | Description |
|----------|--------|-------------|
| `TEAMS_TABLE` | TeamsTable | DynamoDB teams table name |
| `PLAYERS_TABLE` | PlayersTable | DynamoDB players table name |
| `MATCHUPS_TABLE` | MatchupsTable | DynamoDB matchups table name |
| `GAMES_TABLE` | GamesTable | DynamoDB games table name |
| `TOKENS_TABLE` | ConfirmationTokensTable | DynamoDB tokens table name |
| `AUDIT_TABLE` | AuditLogTable | DynamoDB audit table name |
| `COGNITO_USER_POOL_ID` | CognitoUserPool | For JWT verification |
| `SNS_TOPIC_ARN` | NotificationTopic | For SMS/email notifications |
| `AUTO_CONFIRM_HOURS` | Parameter | Auto-confirm timeout |
| `FRONTEND_URL` | CloudFront | For confirmation links |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Stack creation fails | Check IAM permissions; need `iam:CreateRole`, `iam:CreatePolicy`, etc. |
| Lambda timeout | Increase `LambdaMemorySize` parameter or optimize code |
| CORS errors | Update `CorsOrigin` parameter to match frontend domain |
| Email not sending | Verify SES domain/email in AWS Console (sandbox mode) |
| CloudFront 403 | Check S3 bucket policy allows CloudFront OAI |
| Cognito invite not received | Check spam folder; verify SES is out of sandbox |
