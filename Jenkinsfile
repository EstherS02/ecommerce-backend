pipeline {
    agent any

    parameters {
        string(
            name: 'DEPLOY_TAG',
            defaultValue: '',
            description: 'ECR image tag to deploy. Leave empty to deploy the current build.'
        )
    }

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

        stage('Select Deployment Version') {
            steps {
                script {
                    if (params.DEPLOY_TAG?.trim()) {
                        env.DEPLOY_IMAGE_TAG = params.DEPLOY_TAG.trim()
                    } else {
                        env.DEPLOY_IMAGE_TAG = env.IMAGE_TAG
                    }

                    echo "Image built: ${env.IMAGE_TAG}"
                    echo "Image to deploy: ${env.DEPLOY_IMAGE_TAG}"
                }
            }
        }

        stage('Deploy to Application EC2') {
            steps {
                script {

                    def commandId = sh(
                        script: '''
                            aws ssm send-command \
                            --region ''' + AWS_REGION + ''' \
                            --instance-ids ''' + EC2_INSTANCE_ID + ''' \
                            --document-name AWS-RunShellScript \
                            --parameters 'commands=[
                                "cd /home/ubuntu/ecommerce-backend",
                                "CURRENT_TAG=$(grep ^IMAGE_TAG= .env | cut -d= -f2)",
                                "echo Previous version: $CURRENT_TAG",
                                "sed -i \\"s/^IMAGE_TAG=.*/IMAGE_TAG=''' + DEPLOY_IMAGE_TAG + '''/\\" .env",
                                "aws ecr get-login-password --region ''' + AWS_REGION + ''' | docker login --username AWS --password-stdin ''' + ECR_REGISTRY + '''",
                                "docker compose pull",
                                "docker compose up -d",
                                "sleep 5",
                                "curl -f http://localhost/api/health"
                            ]' \
                            --query 'Command.CommandId' \
                            --output text
                        ''',
                        returnStdout: true
                    ).trim()

                    echo "SSM Command ID: ${commandId}"

                    def status = sh(
                        script: '''
                            aws ssm wait command-executed \
                            --region ''' + AWS_REGION + ''' \
                            --command-id ''' + commandId + ''' \
                            --instance-id ''' + EC2_INSTANCE_ID + '''
                        ''',
                        returnStatus: true
                    )

                    if (status != 0) {
                        error("Deployment failed on Application EC2")
                    }

                    echo "Deployment completed successfully."
                    echo "Deployed image: ${ECR_REGISTRY}/${ECR_REPOSITORY}:${DEPLOY_IMAGE_TAG}"
                }
            }
        }

    }
}