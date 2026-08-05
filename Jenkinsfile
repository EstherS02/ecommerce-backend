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

                    // ------------------------------------------------
                    // 1. Get currently deployed image tag
                    // ------------------------------------------------

                    def getTagCommand = sh(
                        script: """
                            aws ssm send-command \
                            --region ${AWS_REGION} \
                            --instance-ids ${EC2_INSTANCE_ID} \
                            --document-name AWS-RunShellScript \
                            --parameters 'commands=[
                                "cd /home/ubuntu/ecommerce-backend",
                                "grep ^IMAGE_TAG= .env"
                            ]' \
                            --query 'Command.CommandId' \
                            --output text
                        """,
                        returnStdout: true
                    ).trim()

                    echo "Get current version command: ${getTagCommand}"

                    def getTagStatus = sh(
                        script: """
                            aws ssm wait command-executed \
                            --region ${AWS_REGION} \
                            --command-id ${getTagCommand} \
                            --instance-id ${EC2_INSTANCE_ID}
                        """,
                        returnStatus: true
                    )

                    if (getTagStatus != 0) {
                        error("Could not get current deployment version")
                    }

                    def previousTag = sh(
                        script: """
                            aws ssm get-command-invocation \
                            --region ${AWS_REGION} \
                            --command-id ${getTagCommand} \
                            --instance-id ${EC2_INSTANCE_ID} \
                            --query 'StandardOutputContent' \
                            --output text
                        """,
                        returnStdout: true
                    ).trim()

                    previousTag = previousTag.replace("IMAGE_TAG=", "").trim()

                    echo "Previous deployed version: ${previousTag}"
                    echo "New version to deploy: ${DEPLOY_IMAGE_TAG}"


                    // ------------------------------------------------
                    // 2. Deploy new version
                    // ------------------------------------------------

                    def deployCommand = sh(
                        script: """
                            aws ssm send-command \
                            --region ${AWS_REGION} \
                            --instance-ids ${EC2_INSTANCE_ID} \
                            --document-name AWS-RunShellScript \
                            --parameters 'commands=[
                                "cd /home/ubuntu/ecommerce-backend",
                                "sed -i \\"s/^IMAGE_TAG=.*/IMAGE_TAG=${DEPLOY_IMAGE_TAG}/\\" .env",
                                "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}",
                                "docker compose pull",
                                "docker compose up -d",
                                "sleep 5",
                                "curl -f http://localhost/api/health"
                            ]' \
                            --query 'Command.CommandId' \
                            --output text
                        """,
                        returnStdout: true
                    ).trim()

                    echo "Deployment command ID: ${deployCommand}"


                    // ------------------------------------------------
                    // 3. Wait for deployment
                    // ------------------------------------------------

                    def deployStatus = sh(
                        script: """
                            aws ssm wait command-executed \
                            --region ${AWS_REGION} \
                            --command-id ${deployCommand} \
                            --instance-id ${EC2_INSTANCE_ID}
                        """,
                        returnStatus: true
                    )


                    // ------------------------------------------------
                    // 4. Deployment succeeded
                    // ------------------------------------------------

                    if (deployStatus == 0) {

                        echo "Deployment successful."
                        echo "Running image: ${DEPLOY_IMAGE_TAG}"

                    } else {

                        // ------------------------------------------------
                        // 5. Deployment failed → Rollback
                        // ------------------------------------------------

                        echo "Deployment failed!"
                        echo "Starting automatic rollback to ${previousTag}"

                        def rollbackCommand = sh(
                            script: """
                                aws ssm send-command \
                                --region ${AWS_REGION} \
                                --instance-ids ${EC2_INSTANCE_ID} \
                                --document-name AWS-RunShellScript \
                                --parameters 'commands=[
                                    "cd /home/ubuntu/ecommerce-backend",
                                    "sed -i \\"s/^IMAGE_TAG=.*/IMAGE_TAG=${previousTag}/\\" .env",
                                    "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}",
                                    "docker compose pull",
                                    "docker compose up -d",
                                    "sleep 5",
                                    "curl -f http://localhost/api/health"
                                ]' \
                                --query 'Command.CommandId' \
                                --output text
                            """,
                            returnStdout: true
                        ).trim()

                        echo "Rollback command ID: ${rollbackCommand}"


                        // ------------------------------------------------
                        // 6. Wait for rollback
                        // ------------------------------------------------

                        def rollbackStatus = sh(
                            script: """
                                aws ssm wait command-executed \
                                --region ${AWS_REGION} \
                                --command-id ${rollbackCommand} \
                                --instance-id ${EC2_INSTANCE_ID}
                            """,
                            returnStatus: true
                        )


                        // ------------------------------------------------
                        // 7. Rollback result
                        // ------------------------------------------------

                        if (rollbackStatus == 0) {

                            echo "Rollback successful."
                            echo "Application restored to version ${previousTag}"

                            error(
                                "Deployment failed, but automatic rollback to ${previousTag} was successful."
                            )

                        } else {

                            error(
                                "CRITICAL: Deployment failed AND automatic rollback failed."
                            )
                        }
                    }
                }
            }
        }

    }
}