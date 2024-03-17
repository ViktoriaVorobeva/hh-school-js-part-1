class Queue {
    constructor() {
        this.queue = [];
        this.head = 0;
        this.tail = 0;
        this.length = 0;
    }

    isEmpty() {
        return this.length === 0;
    }

    push(x) {
        this.queue[this.tail] = x;
        this.tail += 1;
        this.length += 1;
    }

    pop() {
        const x = this.queue[this.head];
        this.queue[this.head] = [];
        this.head += 1;
        this.length -= 1;
        return x;
    }
}

export const findCountryRequest = (countryName, countries) => {
    return countries.find((country) => country.name.common === countryName);
};

const findCountryByBorderName = (countryName, countries) => {
    return countries.find((country) => country.cca3 === countryName);
};

export const calcRoute = (from, to, countries) => {
    const queue = new Queue();
    queue.push([from]);
    const visited = new Set();
    let paths = [];
    let countRequests = 0;

    while (!queue.isEmpty()) {
        const currentPath = queue.pop();
        const currentCountry = currentPath[currentPath.length - 1];

        if (currentCountry === to) {
            if (paths.length === 0 || currentPath.length === paths[0].length) {
                paths.push(currentPath);
            } else if (currentPath.length < paths[0].length) {
                paths = [];
                paths.push(currentPath);
            }
        }

        if (!visited.has(currentCountry.name.common)) {
            visited.add(currentCountry.name.common);
            countRequests += 1;
            if (currentCountry.borders) {
                for (const border of currentCountry.borders) {
                    const country = findCountryByBorderName(border, countries);
                    const newPath = [...currentPath, country];
                    queue.push(newPath);
                }
            }
        }
    }
    return { paths, countRequests };
};
