

Used Selenium with Python's builtin unittest framework to write automated browser tests for the app as stated by the assigment. Selenium basically controls a real Chrome window and clicks around the app the same way a user would so we can verify everything actually works end to end instead of just hoping it does.
There are 10 tests total. They run in order and share one browser session so the whole suite finishes in about 35 seconds.


**Test 1 — Landing page loads**
Opens the app and checks that the Sign in and Get started buttons are visible. Just a basic sanity check that the frontend is actually up and serving the page.

**Test 2 — New user can register**
Fills out the full signup form with a randomly generated username, picks a country, enters a city, and submits. Then checks that it lands on the main dashboard instead of showing an error.

**Test 3 —Existing user can log in**
Uses the account created during setup to log in through the login page. Verifies the nav bar shows up after a successful login.

**Test 4 — Navigation tabs work**
Clicks through the Explore, Bookings, and Dashboard tabs and makes sure each one actually switches the page. Quick way to catch if any tab silently breaks.

**Test 5 — Search works**
Goes to the Explore page and types "tutoring" in the search bar. Waits for the debounce and then checks that either results came back or the empty state appeared — either way the search ran without crashing.

**Test 6 — Messages page loads**
Navigates to the Messages tab and confirms the inbox UI shows up. Checks that the page doesn't just go blank.

**Test 7 — Wallet page loads**
Opens the user dropdown in the nav and clicks Wallet. Verifies the page shows a balance section.

**Test 8 — Depositing funds works**
On the wallet page, types 25 in the deposit input and clicks Add funds. Waits for the response and then checks that either the success message or the updated balance ($25.00) appears on the page.

**Test 9 — Bookings page loads**
Navigates to the Bookings tab and confirms the page renders. Covers the case where someone might have zero bookings vs an actual list.

**Test 10 — User can sign out**
Opens the dropdown and clicks Sign out, then verifies the landing page comes back. Makes sure the logout doesn't just break the UI and leave the user stuck.

#How to run the tests

Make sure both servers are running first:

First start the front and backend development servers.

Then install the dependencies if you haven't already- which in this case we are adding selenium and web:

```bash
pip install selenium webdriver-manager
```

Then just run:

```bash
python tests/selenium_tests.py
```

The first time you run it, webdriver manager will download the right version of ChromeDriver for your Chrome automatically. You don't need to install anything else. A Chrome window will open and you'll be able to watch it go through each test on its own.

If you want it to run in the background without opening a window, uncomment the headless line near the top of `selenium_tests.py`:

Chrome must be installed for this to work.