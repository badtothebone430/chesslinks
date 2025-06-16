from os import system

def main():
    longurl = input("Enter the long URL: ")
    shorturl = input("Enter the short URL: ")
    # Read all lines from _redirects
    with open("_redirects", "r") as f:
        lines = f.readlines()
    # Remove the last line if the file is not empty
    if lines:
        lines = lines[:-1]
    # Write back all but the last line
    with open("_redirects", "w") as f:
        f.writelines(lines)
    # Append the new redirect
    with open("_redirects", "a") as f:
        f.write(f"/{shorturl} {longurl} 301\n")
        f.write("/* https://chess.lokiclarke.com 302\n")
    print("Redirect added successfully.")
    system("git add .")
    system('git commit -am "Add redirect for {}"'.format(shorturl))
    system("git push origin main")

if __name__ == "__main__":
    main()