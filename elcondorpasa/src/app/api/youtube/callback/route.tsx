import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { database } from "@/db/config/mongodb";
import { ObjectId } from "mongodb";

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    // Return HTML that closes window with error
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'youtube-auth',
                status: 'error',
                error: 'no_code'
              }, '*');
              window.close();
            } else {
              // Fallback if no opener
              window.location.href = '/your-clip?error=no_code';
            }
          </script>
          <p>Authentication failed. This window should close automatically.</p>
        </body>
      </html>
      `,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Use your existing database connection
    const usersCollection = database.collection("users");

    const userId = state;
    if (userId && userId !== "anonymous") {
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            youtube: {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiryDate: tokens.expiry_date,
              channelName: userInfo.name,
              email: userInfo.email,
              connected: true,
              connectedAt: new Date(),
            },
          },
        }
      );
    }

    // Return HTML that closes window on success
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'youtube-auth',
                status: 'success',
                data: {
                  channelName: ${JSON.stringify(userInfo.name)},
                  email: ${JSON.stringify(userInfo.email)}
                }
              }, '*');
              window.close();
            } else {
              // Fallback if no opener
              window.location.href = '/your-clip?youtube=connected';
            }
          </script>
          <p>Authentication successful! This window should close automatically.</p>
          <p>If it doesn't close, you can <a href="#" onclick="window.close()">close it manually</a>.</p>
        </body>
      </html>
      `,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Error in YouTube callback:", error);

    // Return HTML that closes window with error
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Failed</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'youtube-auth',
                status: 'error',
                error: 'auth_failed'
              }, '*');
              window.close();
            } else {
              // Fallback if no opener
              window.location.href = '/your-clip?error=auth_failed';
            }
          </script>
          <p>Authentication failed. This window should close automatically.</p>
        </body>
      </html>
      `,
      {
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  }
}
