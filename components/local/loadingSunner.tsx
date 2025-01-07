import { motion } from "framer-motion"


interface PageTransitionProps {
    children: React.ReactNode; // 声明 children 类型
}
const PageTransiton: React.FC<PageTransitionProps> = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {children}
        </motion.div>
    )
}

export default PageTransiton