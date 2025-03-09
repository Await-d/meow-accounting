interface LinkStylesProps {
    color?: "primary" | "secondary" | "success" | "warning" | "danger" | "foreground";
}

export const linkStyles = ({ color = "primary" }: LinkStylesProps = {}) => {
    return `relative inline-flex items-center tap-highlight-transparent outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 text-${color} hover:opacity-80`;
}; 