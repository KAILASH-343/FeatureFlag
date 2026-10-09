pipeline {
    agent any

    environment {
        CI = 'true'
        COMPOSE_PROJECT_NAME = 'featureflag_pipeline'
    }

    stages {
        stage('Checkout Source') {
            steps {
                echo 'Pulling feature branch from repository...'
                checkout scm
            }
        }

        stage('Environment Check') {
            steps {
                sh '''
                    echo "Checking build tools:"
                    node -v
                    npm -v
                    docker --version
                    docker compose version
                '''
            }
        }

        stage('Backend Unit Tests & Stale Logic') {
            steps {
                dir('backend') {
                    sh '''
                        echo "Running Backend Unit Tests & Stale Scoring Validation..."
                        npm ci --silent || npm install
                        npm test
                    '''
                }
            }
        }

        stage('Frontend Build & Bundle') {
            steps {
                dir('frontend') {
                    sh '''
                        echo "Building React Vite Production Assets..."
                        npm ci --silent || npm install
                        npm run build
                    '''
                }
            }
        }

        stage('Docker Compose Validation') {
            steps {
                sh '''
                    echo "Validating Docker Compose syntax & definitions..."
                    docker compose config
                '''
            }
        }

        stage('Build Container Images') {
            steps {
                sh '''
                    echo "Building multi-tier container images..."
                    docker compose build --no-cache
                '''
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution complete.'
            cleanWs()
        }
        success {
            echo '🎉 All stages passed! Feature Flag Governance MVP is ready for deployment.'
        }
        failure {
            echo '❌ Pipeline failed during build, test, or containerization stage.'
        }
    }
}
