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
        GIT_USERNAME = ''
        GIT_TOKEN = ''
        appSourceBranch = 'main'  // Chỉnh sửa theo nhánh bạn muốn
        appSourceRepo = 'https://github.com/Lghthien/CI-dacn.git'  // URL của repo Git
    }
    stages {
        stage('Clone Source') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github', usernameVariable: 'GIT_USERNAME', passwordVariable: 'GIT_TOKEN')]) {
                    // Clone app source repo
                    script {
                        try {
                            echo "Cloning repository ${appSourceRepo} branch ${appSourceBranch}..."
                            git branch: appSourceBranch, url: appSourceRepo, credentialsId: 'github'
                        } catch (Exception e) {
                            error "Không thể clone repository: ${e.message}"
                        }
                    }
                    // Clean up Docker images
                    script {
                        try {
                            def dangling_images = sh(script: 'docker images -f "dangling=true" -q', returnStdout: true).trim()
                            if (dangling_images) {
                                echo "Đang xóa các Docker images bị treo..."
                                sh "echo \"$dangling_images\" | xargs docker rmi"
                            } else {
                                echo "Không có image Docker bị treo để xóa."
                            }
                        } catch (Exception e) {
                            error "Lỗi khi xóa Docker images: ${e.message}"
                        }
                    }
                }
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
                                        SCANNER_HOME \
                                        -Dsonar.projectKey=lethien-frontend \
                                        -Dsonar.sources=. \
                                        -Dsonar.host.url=http://107.22.60.96:9000 \
                                        -Dsonar.login=sqp_b7c053e1f80a9d5c328410059249de24df15e1ed
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
                                script {
                                    try {
                                        sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_USERNAME --password-stdin'
                                        sh 'docker push $DOCKER_HUB_USERNAME/webtravel-frontend:latest'
                                    } catch (Exception e) {
                                        error "Không thể đẩy image frontend: ${e.message}"
                                    }
                                }
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
                                        SCANNER_HOME \
                                        -Dsonar.projectKey=lethien-backend \
                                        -Dsonar.sources=. \backend
                                        -Dsonar.host.url=http://107.22.60.96:9000 \
                                        -Dsonar.login=sqp_2c51c30f6d5a5e5067c77ef5db928c1718a92592
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
                                script {
                                    try {
                                        sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKER_HUB_USERNAME --password-stdin'
                                        sh 'docker push $DOCKER_HUB_USERNAME/webtravel-backend:latest'
                                    } catch (Exception e) {
                                        error "Không thể đẩy image backend: ${e.message}"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    post {
        success {
            echo '🎉 Triển khai thành công!'
        }
        failure {
            echo '❌ Triển khai thất bại. Vui lòng kiểm tra log để biết thêm chi tiết.'
        }
    }
}
