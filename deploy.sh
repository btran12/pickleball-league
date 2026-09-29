#!/bin/bash
# ============================================================
# PicklePal - Deployment Script
# ============================================================
# Usage:
#   ./deploy.sh <environment> <admin-email> [options]
#
# Examples:
#   ./deploy.sh dev admin@example.com
#   ./deploy.sh prod admin@example.com --domain picklepal.example.com --zone Z1234567890
#   ./deploy.sh staging admin@example.com --phone +15551234567
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Defaults
PROJECT_NAME="picklepal"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
STACK_NAME=""
TEMPLATE_FILE="cloudformation/backend.yaml"

# Parse arguments
ENVIRONMENT="${1:-}"
ADMIN_EMAIL="${2:-}"
DOMAIN_NAME=""
HOSTED_ZONE_ID=""
ADMIN_PHONE=""
AUTO_CONFIRM_HOURS=48

shift 2 2>/dev/null || true

while [[ $# -gt 0 ]]; do
  case $1 in
    --domain)
      DOMAIN_NAME="$2"
      shift 2
      ;;
    --zone)
      HOSTED_ZONE_ID="$2"
      shift 2
      ;;
    --phone)
      ADMIN_PHONE="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --auto-confirm)
      AUTO_CONFIRM_HOURS="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [[ -z "$ENVIRONMENT" ]]; then
  echo -e "${RED}Error: Environment is required${NC}"
  echo "Usage: ./deploy.sh <dev|staging|prod> <admin-email> [options]"
  exit 1
fi

if [[ -z "$ADMIN_EMAIL" ]]; then
  echo -e "${RED}Error: Admin email is required${NC}"
  echo "Usage: ./deploy.sh <dev|staging|prod> <admin-email> [options]"
  exit 1
fi

if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
  echo -e "${RED}Error: Environment must be dev, staging, or prod${NC}"
  exit 1
fi

STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║         🥒 PicklePal Deployment              ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "Environment:  ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Region:       ${GREEN}${REGION}${NC}"
echo -e "Stack Name:   ${GREEN}${STACK_NAME}${NC}"
echo -e "Admin Email:  ${GREEN}${ADMIN_EMAIL}${NC}"
if [[ -n "$DOMAIN_NAME" ]]; then
  echo -e "Domain:       ${GREEN}${DOMAIN_NAME}${NC}"
fi
echo ""

# Check AWS credentials
echo -e "${YELLOW}→ Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &>/dev/null; then
  echo -e "${RED}Error: AWS credentials not configured${NC}"
  echo "Run 'aws configure' or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
  exit 1
fi
echo -e "${GREEN}✓ AWS credentials valid${NC}"
echo ""

# Check if stack already exists
echo -e "${YELLOW}→ Checking for existing stack...${NC}"
STACK_EXISTS=false
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" &>/dev/null; then
  STACK_EXISTS=true
  echo -e "${YELLOW}⚠ Stack already exists - will perform update${NC}"
else
  echo -e "${GREEN}✓ No existing stack found - will create new${NC}"
fi
echo ""

# Build parameters
PARAMS="ParameterKey=ProjectName,ParameterValue=${PROJECT_NAME} "
PARAMS+="ParameterKey=Environment,ParameterValue=${ENVIRONMENT} "
PARAMS+="ParameterKey=AdminEmail,ParameterValue=${ADMIN_EMAIL} "
PARAMS+="ParameterKey=AutoConfirmHours,ParameterValue=${AUTO_CONFIRM_HOURS} "

if [[ -n "$ADMIN_PHONE" ]]; then
  PARAMS+="ParameterKey=AdminPhone,ParameterValue=${ADMIN_PHONE} "
fi

if [[ -n "$DOMAIN_NAME" ]]; then
  PARAMS+="ParameterKey=DomainName,ParameterValue=${DOMAIN_NAME} "
fi

if [[ -n "$HOSTED_ZONE_ID" ]]; then
  PARAMS+="ParameterKey=HostedZoneId,ParameterValue=${HOSTED_ZONE_ID} "
fi

# Deploy CloudFormation
echo -e "${YELLOW}→ Deploying CloudFormation stack...${NC}"

if [[ "$STACK_EXISTS" == "true" ]]; then
  aws cloudformation update-stack \
    --stack-name "$STACK_NAME" \
    --template-body "file://${TEMPLATE_FILE}" \
    --parameters $PARAMS \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION" \
    2>/dev/null || {
      echo -e "${YELLOW}⚠ No updates to perform${NC}"
    }
else
  aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-body "file://${TEMPLATE_FILE}" \
    --parameters $PARAMS \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION"
fi

# Wait for stack to complete
echo -e "${YELLOW}→ Waiting for stack deployment (this may take 5-10 minutes)...${NC}"
if [[ "$STACK_EXISTS" == "true" ]]; then
  aws cloudformation wait stack-update-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION"
else
  aws cloudformation wait stack-create-complete \
    --stack-name "$STACK_NAME" \
    --region "$REGION"
fi

echo -e "${GREEN}✓ Stack deployed successfully!${NC}"
echo ""

# Get outputs
echo -e "${YELLOW}→ Retrieving stack outputs...${NC}"
OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs' \
  --output json)

API_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiEndpoint") | .OutputValue')
FRONTEND_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontUrl") | .OutputValue')
BUCKET_NAME=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="FrontendBucketName") | .OutputValue')
CF_DIST_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CloudFrontDistributionId") | .OutputValue')
USER_POOL_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoUserPoolId") | .OutputValue')
CLIENT_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoUserPoolClientId") | .OutputValue')

echo ""
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║          ✅ Deployment Complete!             ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "  ${GREEN}Frontend URL:${NC}  ${FRONTEND_URL}"
echo -e "  ${GREEN}API Endpoint:${NC}  ${API_ENDPOINT}"
echo -e "  ${GREEN}S3 Bucket:${NC}     ${BUCKET_NAME}"
echo -e "  ${GREEN}CF Dist ID:${NC}    ${CF_DIST_ID}"
echo ""
echo -e "  ${GREEN}Cognito Pool:${NC}  ${USER_POOL_ID}"
echo -e "  ${GREEN}Client ID:${NC}     ${CLIENT_ID}"
echo ""

# Deploy frontend
echo -e "${YELLOW}→ Deploying frontend to S3...${NC}"

# Build frontend if dist doesn't exist
if [[ ! -d "dist" ]]; then
  echo -e "${YELLOW}  Building frontend...${NC}"
  npm run build
fi

# Create environment config
cat > dist/config.json << EOF
{
  "apiEndpoint": "${API_ENDPOINT}",
  "cognitoUserPoolId": "${USER_POOL_ID}",
  "cognitoClientId": "${CLIENT_ID}",
  "environment": "${ENVIRONMENT}",
  "region": "${REGION}"
}
EOF

# Upload to S3
aws s3 sync dist/ "s3://${BUCKET_NAME}" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "config.json"

aws s3 sync dist/ "s3://${BUCKET_NAME}" \
  --cache-control "public, max-age=0, must-revalidate" \
  --exclude "*" \
  --include "index.html" \
  --include "config.json"

# Invalidate CloudFront cache
echo -e "${YELLOW}→ Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation \
  --distribution-id "$CF_DIST_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text

echo ""
echo -e "${GREEN}✅ Frontend deployed!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}🥒 PicklePal is live at:${NC} ${FRONTEND_URL}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Check your email (${ADMIN_EMAIL}) for Cognito credentials"
echo "  2. Log in and set your password"
echo "  3. Start managing your pickleball league!"
echo ""
