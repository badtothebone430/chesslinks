from os import system

def main():
    longurl = input("Enter the long URL: ")
    shorturl = input("Enter the short URL: ")
    with open("_redirects", "a") as f:
        f.write(f"/{shorturl} {longurl} 301\n")
    print("Redirect added successfully.")
    system("git add .")
    system('git commit -am "Add redirect for {}"'.format(shorturl))
    system("git push origin main")

if __name__ == "__main__":
    main()