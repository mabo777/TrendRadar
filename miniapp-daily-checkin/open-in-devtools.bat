@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "CLI_PATH=%~1"

if "%CLI_PATH%"=="" (
  set "CLI_PATH=C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat"
)

if not exist "%CLI_PATH%" (
  echo 未找到微信开发者工具 CLI: %CLI_PATH%
  echo 请把 CLI 路径作为第一个参数传入，例如：
  echo   open-in-devtools.bat "C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat"
  exit /b 1
)

call "%CLI_PATH%" open --project "%PROJECT_DIR%"
if errorlevel 1 (
  echo 打开失败，请确认微信开发者工具已安装且 CLI 可用。
  exit /b 1
)

echo 已请求微信开发者工具打开项目：%PROJECT_DIR%
