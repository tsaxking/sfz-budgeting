import { Navbar } from "$lib/model/navbar";

export default () => {
    const sections = Navbar.getSections();
    for (const section of sections.data) {
        Navbar.removeSection(section);
    }
    Navbar.addSection({
        name: 'Budgeting',
        priority: 0,
        links: [
            {
                name: 'Home',
                icon: 'home',
                type: 'material-icons',
                href: '/dashboard',
            },
            {
                name: 'Budgets',
                icon: 'account_balance',
                type: 'material-icons',
                href: '/dashboard/budgets',
            },
            {
                name: 'Report',
                icon: 'assessment',
                type: 'material-icons',
                href: '/dashboard/report',
            }
        ],
    });
};