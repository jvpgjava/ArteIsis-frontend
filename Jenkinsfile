// ArteIsis frontend — branch master → prod | branch hml → homologação
// Repo: https://github.com/jvpgjava/ArteIsis-frontend.git

def deployEnv = (env.BRANCH_NAME == 'hml') ? 'hml' : 'prod'
def deployDir = deployEnv == 'prod' ? '/var/www/arteisis/prod/frontend' : '/var/www/arteisis/hml/frontend'
def ngConfig = deployEnv == 'prod' ? 'production' : 'hml'

pipeline {
    agent any

    environment {
        SSH_HOST = '72.61.47.148'
        SSH_USER = 'jgrando'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Build') {
            steps {
                echo "Branch: ${env.BRANCH_NAME} → ambiente: ${deployEnv} (ng: ${ngConfig})"
                sh 'npm install'
                sh "npm run build -- --configuration=${ngConfig}"
            }
        }

        stage('Deploy static') {
            steps {
                sh """
                    test -f dist/app/browser/index.html || { echo 'Build sem dist/app/browser/index.html'; exit 1; }
                    rsync -avz --delete -e "ssh -o StrictHostKeyChecking=accept-new" dist/app/browser/ ${SSH_USER}@${SSH_HOST}:${deployDir}/
                """
            }
        }
    }
}
