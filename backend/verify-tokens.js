require('dotenv').config();
const { Octokit } = require('@octokit/rest');

async function verifyGitHubToken() {
  console.log('\n🔍 Verifying GitHub Token...');
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.log('❌ GitHub token not found in .env');
    return false;
  }

  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.users.getAuthenticated();
    console.log('✅ GitHub token is valid!');
    console.log(`   Authenticated as: ${data.login}`);
    console.log(`   Account type: ${data.type}`);

    // Test repository access
    const testRepo = await octokit.repos.getContent({
      owner: 'GreedyWorld',
      repo: 'game',
      path: ''
    });
    console.log('✅ Can access public repositories');
    return true;
  } catch (error) {
    console.log('❌ GitHub token is invalid or expired');
    console.log(`   Error: ${error.message}`);
    if (error.status === 401) {
      console.log('   Please generate a new token at: https://github.com/settings/tokens');
    }
    return false;
  }
}

async function verifyTogetherAIToken() {
  console.log('\n🔍 Verifying Together AI Token...');
  const token = process.env.TOGETHER_AI_API_KEY;

  if (!token) {
    console.log('❌ Together AI token not found in .env');
    return false;
  }

  try {
    const response = await fetch('https://api.together.xyz/v1/models', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.ok) {
      console.log('✅ Together AI token is valid!');
      const data = await response.json();
      console.log(`   Available models: ${data.length || 0}`);
      return true;
    } else {
      console.log('❌ Together AI token is invalid');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Error verifying Together AI token');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔐 Token Verification');
  console.log('='.repeat(50));

  const githubValid = await verifyGitHubToken();
  const togetherValid = await verifyTogetherAIToken();

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   GitHub Token: ${githubValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`   Together AI Token: ${togetherValid ? '✅ Valid' : '❌ Invalid'}`);

  if (githubValid && togetherValid) {
    console.log('\n✨ All tokens are valid! Ready to run code quality analysis.');
  } else {
    console.log('\n⚠️  Some tokens need to be updated in the .env file');
  }
}

main().catch(console.error);
