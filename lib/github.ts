import { Octokit } from '@octokit/rest'

/**
 * Returns an authenticated GitHub API client.
 * Requires the GITHUB_TOKEN environment variable to be set
 * (a personal access token or GitHub App installation token with
 * the appropriate repository scopes).
 */
export async function getUncachableGitHubClient(): Promise<Octokit> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      'GITHUB_TOKEN environment variable is not set. ' +
      'Create a token at https://github.com/settings/tokens and add it to your environment.'
    );
  }
  return new Octokit({ auth: token });
}
