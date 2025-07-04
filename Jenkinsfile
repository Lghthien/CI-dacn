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
        // 1. Clone source code
        stage('Clone Source') {
            steps {
                git branch: 'main', url: 'https://github.com/Lghthien/CI-dacn.git'
            }
        }

        // 2. Run Unit Tests
        stage('Run Unit Tests') {
            parallel {
                stage('Test Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm install'
                            sh 'npm run test -- --passWithNoTests'
                        }
                    }
                }
                stage('Test Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm install'
                            sh 'chmod +x ./node_modules/.bin/jest'
                            sh 'npm run test -- --verbose'
                        }
                    }
                }
            }
        }

        // 3. Trivy Scan Source Code
        stage('Trivy Scan Source Code') {
            parallel {
                stage('Scan Frontend') {
                    steps {
                        script {
                            dir('frontend') {
                                sh 'trivy repo . --exit-code 1 --severity HIGH,CRITICAL --format json -o trivy-frontend.json'
                                sh 'cat trivy-frontend.json'
                            }
                        }
                    }
                }
                stage('Scan Backend') {
                    steps {
                        script {
                            dir('backend') {
                                sh 'trivy repo . --exit-code 1 --severity HIGH,CRITICAL --format json -o trivy-backend.json'
                                sh 'cat trivy-backend.json'
                            }
                        }
                    }
                }
            }
        }

        // 4. SonarQube Analysis
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar-server') {
                    sh '''
                        $SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectName=lethien \
                        -Dsonar.projectKey=lethien \
                        -Dsonar.sources=./frontend,./backend \
                        -Dsonar.inclusions=src/**
                    '''
                }
            }
        }

        // 7. Build Docker Images
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        sh 'docker build -t $DOCKER_HUB_USERNAME/webtravel-backend:latest ./backend'
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        sh 'docker build -t $DOCKER_HUB_USERNAME/webtravel-frontend:latest ./frontend'
                    }
                }
            }
        }

        // 8. Trivy Scan Container Images
        stage('Trivy Scan Images') {
            parallel {
                stage('Trivy Scan Backend') {
                    steps {
                        script {
                            sh "trivy image \$DOCKER_HUB_USERNAME/webtravel-backend:latest > trivy-backend.txt"
                            sh "cat trivy-backend.txt"
                        }
                    }
                }
                stage('Trivy Scan Frontend') {
                    steps {
                        script {
                            sh "trivy image \$DOCKER_HUB_USERNAME/webtravel-frontend:latest > trivy-frontend.txt"
                            sh "cat trivy-frontend.txt"
                        }
                    }
                }
            }
        }

        // 9. Login to Docker Hub & Push Images
        stage('Login to Docker Hub & Push Images') {
            steps {
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_USERNAME --password-stdin'
                sh 'docker push $DOCKER_HUB_USERNAME/webtravel-backend:latest'
                sh 'docker push $DOCKER_HUB_USERNAME/webtravel-frontend:latest'
            }
        }
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
