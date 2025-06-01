cd frontend
nvm use 14
npm run build
cd ../backend/core
mv index.html templates/index.html
cd ../../
.venv/bin/python backend/manage.py collectstatic --noinput