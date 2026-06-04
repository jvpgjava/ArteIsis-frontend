// ArteIsis frontend — mesmo padrão Flowtix: deploy local na VPS (sem scp/ssh)
// Branch master → prod | branch hml → homologação
// Repo: https://github.com/jvpgjava/ArteIsis-frontend.git

pipeline {
    agent any

    environment {
        DEPLOY_USER = 'jgrando'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Set Environment') {
            steps {
                script {
                    def branchName = env.BRANCH_NAME ?: env.GIT_BRANCH?.replaceAll('origin/', '') ?: ''
                    if (branchName == 'master') {
                        env.PROFILE      = 'prod'
                        env.DEPLOY_DIR   = '/var/www/arteisis/prod/frontend'
                        env.NG_CONFIG    = 'production'
                        env.ENV_LABEL    = 'PRODUÇÃO'
                    } else if (branchName == 'hml') {
                        env.PROFILE      = 'hml'
                        env.DEPLOY_DIR   = '/var/www/arteisis/hml/frontend'
                        env.NG_CONFIG    = 'hml'
                        env.ENV_LABEL    = 'HOMOLOG'
                    } else {
                        env.PROFILE   = ''
                        env.ENV_LABEL = 'N/A'
                    }
                }
                echo "Branch: ${env.BRANCH_NAME} → Ambiente: ${env.ENV_LABEL} (ng: ${env.NG_CONFIG})"
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            when {
                expression { env.PROFILE != '' }
            }
            steps {
                sh 'npm install'
                sh "npm run build -- --configuration=${env.NG_CONFIG}"
            }
        }

        stage('Deploy') {
            when {
                expression { env.PROFILE != '' }
            }
            steps {
                script {
                    if (!fileExists('dist/app/browser/index.html')) {
                        error 'Build sem dist/app/browser/index.html'
                    }
                    sh """
                        sudo mkdir -p ${env.DEPLOY_DIR}
                        sudo rsync -av --delete dist/app/browser/ ${env.DEPLOY_DIR}/
                        sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${env.DEPLOY_DIR}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "ArteIsis frontend [${env.ENV_LABEL}] concluído com sucesso."
        }
        failure {
            echo "ArteIsis frontend [${env.ENV_LABEL}] falhou. Verifique os logs."
        }
        always {
            cleanWs(deleteDirs: true, notFailBuild: true)
        }
    }
}
