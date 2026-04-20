# Selenium Automated Testing

## What is Selenium?

So basically Selenium is a tool that controls your web browser automatically. Instead of you sitting there clicking around the website yourself to make sure everything works, Selenium does it for you. It opens Chrome, goes to the site, clicks buttons, fills out forms, and checks that the right things show up on the screen. It's like a robot that pretends to be a real user.

We wrote 10 of these automated tests for our marketplace app. Each one tests a different part of the site.

---

## What the tests actually do

**Test 1 — Does the home page load?**
This one just opens the website and makes sure the main page actually shows up with the Sign in and Get started buttons. If the site is completely broken this will catch it right away.

**Test 2 — Can someone create a new account?**
Goes through the whole signup process — fills in a first name, last name, username, email, password, country, and city, then clicks Create account. Checks that after signing up the user lands on the dashboard and not some error screen.

**Test 3 — Can someone log in?**
Takes an account that was already created and logs in with the username and password. Makes sure the app actually lets you in and shows the main page.

**Test 4 — Do the navigation buttons work?**
Once logged in, clicks on the Explore, Bookings, and Dashboard buttons at the top of the page one by one. Makes sure each button actually switches to the right page instead of doing nothing or breaking.

**Test 5 — Does search work?**
Goes to the Explore page and types "tutoring" in the search bar. Waits a moment and then checks that the page responded — either by showing matching services or showing a no results message. Either way the search has to do something.

**Test 6 — Does the Messages page open?**
Clicks on the Messages tab and makes sure the page loads and shows the inbox. Just checking it doesn't go blank or crash.

**Test 7 — Does the Wallet page open?**
Clicks the user menu in the top right corner, selects Wallet, and checks that the page shows up with a balance on it.

**Test 8 — Can someone add money to their wallet?**
On the wallet page, types 25 into the deposit box and clicks Add funds. Then checks that the page shows either a success message or the updated balance with $25. This confirms the deposit feature is actually working.

**Test 9 — Does the Bookings page open?**
Clicks the Bookings tab and makes sure the page loads, whether the user has bookings or not.

**Test 10 — Can someone log out?**
Opens the menu in the top right and clicks Sign out. Then checks that the homepage comes back with the Sign in button. Making sure the logout doesn't just freeze the page.

---

## How to run the tests

Before running anything you need both parts of the app running at the same time — the backend which is the server that handles all the data, and the frontend which is the actual website. Open two separate terminal windows and run each one.

Once both are running, install the testing tools if you haven't already:

```bash
pip install selenium webdriver-manager
```

Then to run all 10 tests:

```bash
python tests/selenium_tests.py
```

A Chrome window will pop open on its own and you can watch it go through every test by itself. It clicks around, fills in forms, and checks things automatically. The whole thing takes about 35 seconds. When it's done it will tell you how many tests passed and if any failed.

You don't need to download or install anything extra for Chrome — the tool figures out what version you have and handles it on its own.
