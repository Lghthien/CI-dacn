pipeline {
    agent any
    environment {
        DOCKER_BUILDKIT = 1
        DOCKER_HUB_USERNAME = 'legiahoangthien'
        DOCKERHUB_CREDENTIALS = credentials('travelweb-dockerhub')
        SNYK_TOKEN = credentials('snyk-token')      // Đảm bảo đã tạo credential này
        SCANNER_HOME = tool 'jenkins-sonar'
    }
    stages {
        stage('Clone Source') {
            steps {
                git branch: 'main', url: 'https://github.com/Lghthien/CI-dacn.git'
            }
        }

         stage('Run Unit Tests') {
            parallel {
                stage('Test Client') {
                    steps {
                        dir('client') {
                            sh 'npm install'
                            sh 'npm run test -- --passWithNoTests'
                        }
                    }
                }
                stage('Test Server') {
                    steps {
                        dir('server') {
                            sh 'npm install'
                            sh 'chmod +x ./node_modules/.bin/jest'
                            sh 'npm run test -- --verbose'
                        }
                    }
                }
            }
        }

          stage('Run Unit Build') {
            parallel {
                stage('Build Client') {
                    steps {
                        dir('client') {
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
                }
                stage('Build Server') {
                    steps {
                        dir('server') {
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Snyk Scan Source') {
            parallel {
                stage('Snyk Scan Client') {
                    steps {
                        dir('client') {
                            sh '''
                                npm install -g snyk
                                snyk auth $SNYK_TOKEN
                                snyk test --all-projects
                            '''
                        }
                    }
                }
                stage('Snyk Scan Server') {
                    steps {
                        dir('server') {
                            sh '''
                                npm install -g snyk
                                snyk auth $SNYK_TOKEN
                                snyk test --all-projects
                            '''
                        }
                    }
                }
            }
        }

        // 2. SonarQube phân tích mã nguồn
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sq1') {
                    sh '''
                        $SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectName=lethien \
                        -Dsonar.projectKey=lethien \
                        -Dsonar.sources=./client/src,./server/src
                    '''
                }
            }
        }

          stage('OWASP Dependency-Check') {
            parallel {
                stage('Dependency-Check Client') {
                    steps {
                        dir('client') {
                            sh '''
                                docker run --rm -v $(pwd):/src owasp/dependency-check \
                                --project "client" --scan /src --format "HTML" --out /src/dependency-check-report
                            '''
                        }
                    }
                }
                stage('Dependency-Check Server') {
                    steps {
                        dir('server') {
                            sh '''
                                docker run --rm -v $(pwd):/src owasp/dependency-check \
                                --project "server" --scan /src --format "HTML" --out /src/dependency-check-report
                            '''
                        }
                    }
                }
            }
        }

        // 4. Build Docker Image song song
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        sh 'docker build --no-cache -t $DOCKER_HUB_USERNAME/webtravel-backend:latest ./backend'
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        sh 'docker build --no-cache -t $DOCKER_HUB_USERNAME/webtravel-frontend:latest ./frontend'
                    }
                }
            }
        }

        // 5. Trivy Scan Container Images
        stage('Trivy Scan Images') {
            parallel {
                stage('Trivy Scan Backend') {
                    steps {
                        sh 'trivy image --exit-code 1 --no-progress --severity HIGH,CRITICAL $DOCKER_HUB_USERNAME/webtravel-backend:latest'
                    }
                }
                stage('Trivy Scan Frontend') {
                    steps {
                        sh 'trivy image --exit-code 1 --no-progress --severity HIGH,CRITICAL $DOCKER_HUB_USERNAME/webtravel-frontend:latest'
                    }
                }
            }
        }

        // 6. Push Docker Images nếu đã pass hết các bước bảo mật
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
