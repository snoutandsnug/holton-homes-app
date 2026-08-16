# Upload Holton Homes OS v13 now

## 1. Replace the GitHub files

1. Unzip `Holton-Homes-OS-v13-upload.zip` on your computer.
2. Open the `holton-homes-app` repository on GitHub and choose **Add file → Upload files**.
3. Drag every extracted file and folder into the upload area. Keep `assets` as a folder.
4. Use the commit message `Release Holton Homes OS v13` and commit directly to `main`.

The existing Supabase configuration is included. Do not paste a service-role key or database password into any browser file.

## 2. Connect the existing Vercel project to GitHub

The production project is already live at `https://holton-homes-os.vercel.app`.

Only connect GitHub **after the v13 files are committed to `main`**. Connecting first could deploy the older repository version over the tested release.

1. Open the `holton-homes-os` project in Vercel.
2. Open **Settings → Git**.
3. Choose **Connect Git Repository** and select `snoutandsnug/holton-homes-app`.
4. Confirm `main` as the Production Branch.
5. Keep Framework Preset as **Other**, Root Directory as `./`, and Build, Output, and Install commands empty.

No Vercel environment variables are required for this static release. Future pushes to `main` will deploy automatically after the GitHub connection is enabled.

## 3. First production check

Open the Vercel URL in a private window, sign in, and verify Today, Inbox, People, Opportunities, Transactions, Content, Local Network, and Settings. Then download a JSON safety backup from the Reliability Center.
