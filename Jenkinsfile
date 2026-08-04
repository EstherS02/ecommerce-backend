pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        ECR_REGISTRY = '250761481176.dkr.ecr.ap-south-1.amazonaws.com'
        ECR_REPOSITORY = 'ecommerce-backend'
        IMAGE_TAG = "${BUILD_NUMBER}"
        EC2_INSTANCE_ID = 'i-0ed0cbd24084ce087'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                    docker build \
                      -t ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG} .
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login \
                      --username AWS \
                      --password-stdin ${ECR_REGISTRY}
                '''
            }
        }

        stage('Push Image to ECR') {
            steps {
                sh '''
                    docker push \
                      ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                '''
            }
        }

        stage('Deploy to Application EC2') {
            steps {
                sh '''
                    aws ssm send-command \
                      --region ${AWS_REGION} \
                      --instance-ids ${EC2_INSTANCE_ID} \
                      --document-name "AWS-RunShellScript" \
                      --parameters commands='[
                        "cd /home/ubuntu/ecommerce-backend",
                        "sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=${IMAGE_TAG}/' .env",
                        "docker compose pull",
                        "docker compose up -d"
                      ]'
                '''
            }
        }
    }
}