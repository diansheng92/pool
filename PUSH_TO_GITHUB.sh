#!/bin/bash
# Instructions: After creating your private repo on GitHub, run this script

echo "📦 Pushing Five Star Pools project to GitHub..."
echo ""
echo "⚠️  IMPORTANT: Replace YOUR_USERNAME with your actual GitHub username below!"
echo ""
read -p "Enter your GitHub username: " username

if [ -z "$username" ]; then
    echo "❌ Username cannot be empty"
    exit 1
fi

echo ""
echo "🔗 Adding remote origin..."
git remote add origin "https://github.com/$username/pool.git" 2>/dev/null || git remote set-url origin "https://github.com/$username/pool.git"

echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Your repository is now on GitHub:"
    echo "   https://github.com/$username/pool"
    echo ""
    echo "🔒 Make sure the repository is set to Private in GitHub settings"
else
    echo ""
    echo "❌ Push failed. You may need to:"
    echo "   1. Create the repository on GitHub first: https://github.com/new"
    echo "   2. Generate a Personal Access Token: https://github.com/settings/tokens"
    echo "   3. Use the token as your password when prompted"
fi
