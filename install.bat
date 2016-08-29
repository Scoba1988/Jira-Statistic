@echo Installing npm dependencies
call npm install && npm run-script build

if errorlevel 1 (
	@echo ********** BUILD FAILURE **********
	@echo Failed to install npm dependencies
	exit /b 1
)
