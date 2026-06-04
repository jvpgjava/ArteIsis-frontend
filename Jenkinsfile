// ArteIsis — deploy frontend (prod | hml)
// Repo: https://github.com/jvpgjava/ArteIsis-frontend.git

pipeline {
    agent any

    parameters {
        choice(name: 'ENV', choices: ['prod', 'hml'], description: 'Ambiente de deploy')
    }

    environment {
        SSH_HOST = '72.61.47.148'
        SSH_USER = 'jgrando'
        DEPLOY_DIR = "${params.ENV == 'prod' ? '/var/www/arteisis/prod/frontend' : '/var/www/arteisis/hml/frontend'}"
        NG_CONFIG = "${params.ENV == 'prod' ? 'production' : 'hml'}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Build') {
            steps {
                sh 'npm install'
                sh "npm run build -- --configuration=${NG_CONFIG}"
            }
        }

        stage('Deploy static') {
            steps {
                sh """
                    test -f dist/app/browser/index.html || { echo 'Build sem dist/app/browser/index.html'; exit 1; }
                    rsync -avz --delete -e "ssh -o StrictHostKeyChecking=accept-new" dist/app/browser/ ${SSH_USER}@${SSH_HOST}:${DEPLOY_DIR}/
                """
            }
        }
    }
}
