pipeline {
    agent any
    tools {
        jdk 'JDK17'
        nodejs 'NODE20'
    }
    environment {
        DOCKER_BUILDKIT = 1
        DOCKER_HUB_USERNAME = 'legiahoangthien'
        DOCKERHUB_CREDENTIALS = credentials('travelweb-dockerhub')
        SCANNER_HOME = tool 'jenkins-sonar'
        DEPENDENCY_CHECK_TOOL = 'DP-Check'
    }
    stages {
        stage('Clone Source') {
            steps {
                git branch: 'main', url: 'https://github.com/Lghthien/CI-dacn.git'
            }
        }

        stage('Build and Push Services') {
            parallel {
                stage('Frontend Pipeline') {
                    when {
                        changeset "**/frontend/**"
                    }
                    stages {
                        stage('Test Frontend') {
                            steps {
                                dir('frontend') {
                                    sh 'npm install'
                                    sh 'npm run test -- --passWithNoTests'
                                }
                            }
                        }
                        stage('Trivy Scan Frontend') {
                            steps {
                                dir('frontend') {
                                    sh 'trivy repo . --exit-code 1 --severity HIGH,CRITICAL --format json -o trivy-frontend.json'
                                    sh 'cat trivy-frontend.json'
                                }
                            }
                        }
                        stage('SonarQube Frontend Analysis') {
                            steps {
                                withSonarQubeEnv('sonar-server') {
                                    sh '''
                                        $SCANNER_HOME/bin/sonar-scanner \
                                        -Dsonar.projectName=lethien-frontend \
                                        -Dsonar.projectKey=lethien-frontend \
                                        -Dsonar.sources=./frontend \
                                        -Dsonar.inclusions=src/**
                                    '''
                                }
                            }
                        }
                    
                        stage('Build Frontend Docker Image') {
                            steps {
                                sh 'docker build -t $DOCKER_HUB_USERNAME/webtravel-frontend:latest ./frontend'
                            }
                        }
                        stage('Trivy Scan Frontend Image') {
                            steps {
                                sh 'trivy image $DOCKER_HUB_USERNAME/webtravel-frontend:latest > trivy-frontend.txt'
                                sh 'cat trivy-frontend.txt'
                            }
                        }
                        stage('Push Frontend Image') {
                            steps {
                                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_USERNAME --password-stdin'
                                sh 'docker push $DOCKER_HUB_USERNAME/webtravel-frontend:latest'
                            }
                        }
                    }
                }
                stage('Backend Pipeline') {
                    when {
                        changeset "**/backend/**"
                    }
                    stages {
                        stage('Test Backend') {
                            steps {
                                dir('backend') {
                                    sh 'npm install'
                                    sh 'chmod +x ./node_modules/.bin/jest'
                                    sh 'npm run test -- --verbose'
                                }
                            }
                        }
                        stage('Trivy Scan Backend') {
                            steps {
                                dir('backend') {
                                    sh 'trivy repo . --exit-code 1 --severity HIGH,CRITICAL --format json -o trivy-backend.json'
                                    sh 'cat trivy-backend.json'
                                }
                            }
                        }
                        stage('SonarQube Backend Analysis') {
                            steps {
                                withSonarQubeEnv('sonar-server') {
                                    sh '''
                                        $SCANNER_HOME/bin/sonar-scanner \
                                        -Dsonar.projectName=lethien-backend \
                                        -Dsonar.projectKey=lethien-backend \
                                        -Dsonar.sources=./backend \
                                        -Dsonar.inclusions=src/**
                                    '''
                                }
                            }
                        }
                        stage('Build Backend Docker Image') {
                            steps {
                                sh 'docker build -t $DOCKER_HUB_USERNAME/webtravel-backend:latest ./backend'
                            }
                        }
                        stage('Trivy Scan Backend Image') {
                            steps {
                                sh 'trivy image $DOCKER_HUB_USERNAME/webtravel-backend:latest > trivy-backend.txt'
                                sh 'cat trivy-backend.txt'
                            }
                        }
                        stage('Push Backend Image') {
                            steps {
                                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_USERNAME --password-stdin'
                                sh 'docker push $DOCKER_HUB_USERNAME/webtravel-backend:latest'
                            }
                        }
                    }
                }
            }
        }

        // stage('Deploy Docker Compose') {
        //     when {
        //         anyOf {
        //             changeset "**/frontend/**"
        //             changeset "**/backend/**"
        //             changeset "docker-compose.yml"
        //         }
        //     }
        //     steps {
        //         sh 'docker-compose up -d'
        //     }
        // }
    }

    post {
        success {
            echo '🎉 Deployment succeeded!'
        }
        failure {
            echo '❌ Deployment failed. Please check the logs for errors.'
        }
    }
}
