import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, MapPin, Plane, Briefcase, Palmtree, List, Menu, X, Sun, CloudRain, Hotel, Calendar, PackageCheck } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Main App Component
export default function TravelPlanner() {
  // State for navigation and UI
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("planner");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State for trip details
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tripType, setTripType] = useState("family");
  
  // State for saved trips
  const [savedTrips, setSavedTrips] = useState({
    business: [],
    family: []
  });
  
  // State for chatbot
  const [chatMessages, setChatMessages] = useState([
    { role: "bot", content: "Hello! I'm your AI travel assistant. Ask me about destinations, attractions, or travel tips!" }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  
  // State for generated trip content
  const [weather, setWeather] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [packingItems, setPackingItems] = useState([]);
  const [customItems, setCustomItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [tripGenerated, setTripGenerated] = useState(false);

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI("AIzaSyB5uSgFLHoU9VDEViWMgfwrTmzRe3XfxKc");

  // Scroll to bottom of chat automatically
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Generate AI response for chat
  const generateAIResponse = async (userQuery) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Create a contextualized prompt based on destination and trip type
      const prompt = `
      You are a helpful travel assistant specialized in providing information about ${destination || "various travel destinations"}.
      The user is planning a ${tripType} trip${destination ? ` to ${destination}` : ""}.
      
     Provide him whatever he ask related to bussiness 
      `;

      const result = await model.generateContent(`${prompt}\nUser: ${userQuery}`);
      return result.response?.text() || "Sorry, I couldn't process your request.";
    } catch (error) {
      console.error("Error generating response:", error);
      return "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
    }
  };

  // Generate AI packing list
  const generatePackingList = async () => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
      Generate a concise packing list for a ${tripType} trip to ${destination || "any destination"}.
      The trip is from ${startDate || "start date"} to ${endDate || "end date"}.
      Format as a simple list with 12-15 essential items.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response?.text() || "Could not generate packing list.";
      
      // Parse the response into an array of items
      const items = responseText
        .split('\n')
        .filter(item => item.trim() !== '')
        .map(item => item.replace(/^[-*•⁃◦‣⦿⦾▪▫◆◇■□●○]\s*/, '').trim());
      
      return items;
    } catch (error) {
      console.error("Error generating packing list:", error);
      return tripType === "business" ? 
        ["Business attire", "Laptop", "Chargers", "Business cards", "Travel documents"] : 
        ["Casual clothes", "Camera", "Sunscreen", "Swimwear", "Travel documents"];
    }
  };

  // Handle chat message submission
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    // Add user message to chat
    const newUserMessage = { role: "user", content: userInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    
    // Get AI response
    const aiResponse = await generateAIResponse(userInput);
    setChatMessages(prev => [...prev, { role: "bot", content: aiResponse }]);
    
    setUserInput("");
    setIsLoading(false);
  };

  // Handle trip generation
  const handleGenerateTrip = async () => {
    if (!destination) {
      alert("Please enter a destination");
      return;
    }
    
    setTripGenerated(true);
    setIsLoading(true);
    setActiveTab("planner");
    
    try {
      // Generate packing list with AI
      const items = await generatePackingList();
      setPackingItems(items);
      
      // Generate destination info with AI
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Get attractions
      const attractionsPrompt = `
      List 5 popular attractions in ${destination} with a brief one-sentence description for each.
      Format as JSON array with "name" and "description" fields.
      Example: [{"name": "Eiffel Tower", "description": "Iconic iron tower with city views"}]
      Only respond with the JSON.
      `;
      
      const attractionsResult = await model.generateContent(attractionsPrompt);
      const attractionsText = attractionsResult.response?.text() || "[]";
      
      try {
        const attractionsData = JSON.parse(attractionsText);
        setAttractions(attractionsData);
      } catch {
        setAttractions([
          { name: "Popular Attraction 1", description: "Famous landmark in the area" },
          { name: "Popular Attraction 2", description: "Must-visit historical site" },
          { name: "Popular Attraction 3", description: "Local cultural experience" }
        ]);
      }
      
      // Get hotels
      const hotelsPrompt = `
      List 3 hotels in ${destination} with different price ranges.
      Format as JSON array with "name", "price" (as $, $$, or $$$), "rating", and "amenities" fields.
      Example: [{"name": "Grand Hotel", "price": "$$$", "rating": "4.7 ★", "amenities": "Pool, Spa, Restaurant"}]
      Only respond with the JSON.
      `;
      
      const hotelsResult = await model.generateContent(hotelsPrompt);
      const hotelsText = hotelsResult.response?.text() || "[]";
      
      try {
        const hotelsData = JSON.parse(hotelsText);
        setHotels(hotelsData);
      } catch {
        setHotels([
          { name: "Luxury Hotel", price: "$$$", rating: "4.8 ★", amenities: "All amenities" },
          { name: "Mid-range Hotel", price: "$$", rating: "4.2 ★", amenities: "Basic amenities" },
          { name: "Budget Option", price: "$", rating: "3.5 ★", amenities: "Basic room" }
        ]);
      }
      
      // Set mock weather data
      const weatherOptions = [
        { temp: "24°C", condition: "Sunny", icon: <Sun className="text-yellow-500" /> },
        { temp: "18°C", condition: "Rainy", icon: <CloudRain className="text-blue-500" /> },
        { temp: "21°C", condition: "Partly Cloudy", icon: <CloudRain className="text-gray-500" /> }
      ];
      setWeather(weatherOptions[Math.floor(Math.random() * weatherOptions.length)]);
      
    } catch (error) {
      console.error("Error generating trip data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save current trip
  const saveCurrentTrip = () => {
    if (!destination || !tripGenerated) return;
    
    const newTrip = {
      id: Date.now(),
      destination,
      startDate,
      endDate,
      packingItems: [...packingItems, ...customItems],
      timestamp: new Date().toLocaleString()
    };
    
    setSavedTrips(prev => ({
      ...prev,
      [tripType]: [...prev[tripType], newTrip]
    }));
    
    alert("Trip saved successfully!");
  };

  // Delete saved trip
  const deleteSavedTrip = (id) => {
    setSavedTrips(prev => ({
      ...prev,
      [tripType]: prev[tripType].filter(trip => trip.id !== id)
    }));
  };

  // Add custom packing item
  const addCustomItem = () => {
    if (!newItem.trim()) return;
    setCustomItems([...customItems, newItem]);
    setNewItem("");
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Plane size={24} />
            <h1 className="text-2xl font-bold">TravelPlanner</h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            <button 
              className={`px-4 py-2 rounded-lg ${activeTab === "planner" ? "bg-white text-indigo-600" : "text-white"}`}
              onClick={() => setActiveTab("planner")}
            >
              <List size={18} className="inline mr-2" />
              Trip Planner
            </button>
            <button 
              className={`px-4 py-2 rounded-lg ${activeTab === "chat" ? "bg-white text-indigo-600" : "text-white"}`}
              onClick={() => setActiveTab("chat")}
            >
              <Bot size={18} className="inline mr-2" />
              AI Assistant
            </button>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-700 text-white p-4">
          <button 
            className={`block w-full text-left px-4 py-2 mb-2 rounded-lg ${activeTab === "planner" ? "bg-white text-indigo-600" : ""}`}
            onClick={() => {
              setActiveTab("planner");
              setMobileMenuOpen(false);
            }}
          >
            <List size={18} className="inline mr-2" />
            Trip Planner
          </button>
          <button 
            className={`block w-full text-left px-4 py-2 rounded-lg ${activeTab === "chat" ? "bg-white text-indigo-600" : ""}`}
            onClick={() => {
              setActiveTab("chat");
              setMobileMenuOpen(false);
            }}
          >
            <Bot size={18} className="inline mr-2" />
            AI Assistant
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with Saved Trips */}
        <div className={`${sidebarOpen ? "block" : "hidden"} md:block w-64 bg-white border-r p-4 overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">Saved Trips</h2>
            <button 
              onClick={toggleSidebar}
              className="md:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex mb-4">
            <button 
              className={`flex-1 py-2 text-center ${tripType === "business" ? "bg-indigo-100 text-indigo-700 font-medium" : "bg-gray-100"}`}
              onClick={() => setTripType("business")}
            >
              Business
            </button>
            <button 
              className={`flex-1 py-2 text-center ${tripType === "family" ? "bg-indigo-100 text-indigo-700 font-medium" : "bg-gray-100"}`}
              onClick={() => setTripType("family")}
            >
              Family
            </button>
          </div>
          
          {savedTrips[tripType].length === 0 ? (
            <p className="text-gray-500 text-sm">No saved trips yet.</p>
          ) : (
            savedTrips[tripType].map(trip => (
              <div key={trip.id} className="mb-4 p-3 bg-gray-50 rounded-lg border">
                <h3 className="font-medium">{trip.destination}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  {trip.startDate && trip.endDate 
                    ? `${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()}`
                    : trip.timestamp
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">{trip.packingItems.length} items packed</p>
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => deleteSavedTrip(trip.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Sidebar Toggle */}
          <div className="md:hidden p-2 border-b">
            <button 
              onClick={toggleSidebar}
              className="flex items-center text-gray-600 hover:text-indigo-600"
            >
              <Menu size={20} className="mr-2" />
              <span>Saved Trips</span>
            </button>
          </div>
          
          {/* Trip Planner Tab */}
          {activeTab === "planner" && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-4xl mx-auto">
                {/* Trip Form */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                  <h2 className="text-xl font-bold mb-4">Plan Your {tripType === "business" ? "Business" : "Family"} Trip</h2>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <MapPin size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder="Enter city or country"
                          className="flex-1 block w-full rounded-r-md border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type</label>
                      <div className="flex">
                        <button
                          onClick={() => setTripType("business")}
                          className={`flex-1 py-2 px-4 flex justify-center items-center ${
                            tripType === "business"
                              ? "bg-indigo-100 text-indigo-700 border-indigo-500"
                              : "bg-white text-gray-700 border-gray-300"
                          } border rounded-l`}
                        >
                          <Briefcase size={16} className="mr-2" />
                          Business
                        </button>
                        <button
                          onClick={() => setTripType("family")}
                          className={`flex-1 py-2 px-4 flex justify-center items-center ${
                            tripType === "family"
                              ? "bg-indigo-100 text-indigo-700 border-indigo-500"
                              : "bg-white text-gray-700 border-gray-300"
                          } border rounded-r border-l-0`}
                        >
                          <Palmtree size={16} className="mr-2" />
                          Family
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <Calendar size={16} />
                        </span>
                        <input
                          type="date"
                          className="flex-1 block w-full rounded-r-md border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <Calendar size={16} />
                        </span>
                        <input
                          type="date"
                          className="flex-1 block w-full rounded-r-md border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={handleGenerateTrip}
                      className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 flex items-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Plane size={18} className="mr-2" />
                          Generate Trip Plan
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Trip Results */}
                {tripGenerated && (
                  <div className="space-y-6">
                    {/* Trip Overview */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold">{destination}</h2>
                          {startDate && endDate && (
                            <p className="text-gray-600">
                              {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                            </p>
                          )}
                          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                            {tripType === "business" ? (
                              <>
                                <Briefcase size={14} className="mr-1" />
                                Business Trip
                              </>
                            ) : (
                              <>
                                <Palmtree size={14} className="mr-1" />
                                Family Trip
                              </>
                            )}
                          </div>
                        </div>
                        
                        {weather && (
                          <div className="text-right">
                            <div className="flex items-center justify-end">
                              {weather.icon}
                              <span className="ml-1 font-medium">{weather.temp}</span>
                            </div>
                            <p className="text-sm text-gray-600">{weather.condition}</p>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={saveCurrentTrip}
                        className="mt-4 flex items-center text-indigo-600 hover:text-indigo-800"
                      >
                        <List size={16} className="mr-1" />
                        Save this trip
                      </button>
                    </div>
                    
                    {/* Attractions */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-bold mb-4">Top Attractions</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {attractions.map((attraction, index) => (
                          <div key={index} className="border rounded-lg p-4 hover:shadow-md transition">
                            <h4 className="font-medium">{attraction.name}</h4>
                            <p className="text-sm text-gray-600">{attraction.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Hotels */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-bold mb-4">Recommended Accommodations</h3>
                      <div className="space-y-4">
                        {hotels.map((hotel, index) => (
                          <div key={index} className="flex items-start border-b pb-4 last:border-0 last:pb-0">
                            <div className="bg-gray-100 p-3 rounded-lg mr-4">
                              <Hotel size={24} className="text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium">{hotel.name}</h4>
                                <span className="text-gray-600">{hotel.price}</span>
                              </div>
                              <p className="text-sm text-gray-500">{hotel.rating} • {hotel.amenities}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Packing List */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-bold mb-4">
                        <div className="flex items-center">
                          <PackageCheck size={20} className="mr-2 text-indigo-600" />
                          Packing List
                        </div>
                      </h3>
                      
                      <ul className="grid md:grid-cols-2 gap-2 mb-6">
                        {packingItems.map((item, index) => (
                          <li key={index} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`item-${index}`}
                              className="mr-2 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor={`item-${index}`} className="text-gray-700">{item}</label>
                          </li>
                        ))}
                        {customItems.map((item, index) => (
                          <li key={`custom-${index}`} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`custom-${index}`}
                              className="mr-2 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor={`custom-${index}`} className="text-gray-700">{item}</label>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="flex">
                        <input
                          type="text"
                          placeholder="Add custom item"
                          className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={newItem}
                          onChange={(e) => setNewItem(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addCustomItem()}
                        />
                        <button
                          onClick={addCustomItem}
                          className="bg-indigo-600 text-white px-4 rounded-r hover:bg-indigo-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* AI Assistant Chat Tab */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`mb-4 p-4 rounded-lg max-w-md ${
                        msg.role === "user"
                          ? "bg-indigo-500 text-white ml-auto"
                          : "bg-white border border-gray-200 mr-auto"
                      }`}
                    >
                      <div className="flex items-start">
                        {msg.role === "bot" && (
                          <div className="mr-2 mt-1">
                            <Bot size={18} className="text-indigo-600" />
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-center space-x-2 p-4 rounded-lg bg-white border border-gray-200 mr-auto max-w-md">
                      <div className="animate-pulse flex space-x-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                      </div>
                      <span className="text-gray-500">Thinking...</span>
                    </div>
                  )}
                  
                  <div ref={chatEndRef}></div>
                </div>
              </div>
              
              {/* Chat Input */}
              <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Ask about travel tips, destinations, or attractions..."
                      className="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white p-3 rounded-r-lg hover:bg-indigo-700 disabled:bg-indigo-300"
                      disabled={isLoading || !userInput.trim()}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}